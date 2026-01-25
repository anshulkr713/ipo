interface AllotmentInput {
    ipoName: string;
    totalShares: number;
    lotSize: number;
    pricePerShare: number;
    appliedLots: number;
    category: 'retail' | 'hni' | 'qib';
    oversubscription: number;
}

interface AllotmentResult {
    probability: number;
    expectedLots: number;
    expectedShares: number;
    expectedValue: number;
    factors: {
        oversubscriptionImpact: number;
        categoryImpact: number;
        lotSizeImpact: number;
    };
    recommendation: string;
}

function generateRecommendation(probability: number, input: AllotmentInput): string {
    if (probability >= 80) {
        return `High chance of allotment. Consider applying for ${input.appliedLots} lots.`;
    } else if (probability >= 50) {
        return `Moderate chance of allotment. The ${input.category} category has decent odds.`;
    } else if (probability >= 20) {
        return `Low chance of allotment due to ${input.oversubscription}x oversubscription. Consider applying with multiple accounts.`;
    } else {
        return `Very low chance of allotment. The IPO is heavily oversubscribed at ${input.oversubscription}x.`;
    }
}

function calculateAllotmentProbability(input: AllotmentInput): AllotmentResult {
    // Base probability formula
    const baseProbability = 100 / input.oversubscription;

    // Category modifiers
    const categoryMultiplier = {
        retail: 1.0,
        hni: 0.85,
        qib: 0.70
    }[input.category];

    // Lot size impact (applying for more lots can reduce probability)
    const lotImpact = Math.max(0.5, 1 - (input.appliedLots * 0.02));

    // Final probability
    const probability = Math.min(100,
        baseProbability * categoryMultiplier * lotImpact
    );

    // Expected allotment
    const expectedLots = Math.floor(
        (input.appliedLots * probability) / 100
    );

    return {
        probability: Math.round(probability * 100) / 100,
        expectedLots,
        expectedShares: expectedLots * input.lotSize,
        expectedValue: expectedLots * input.lotSize * input.pricePerShare,
        factors: {
            oversubscriptionImpact: (100 - baseProbability),
            categoryImpact: ((categoryMultiplier - 1) * 100),
            lotSizeImpact: ((lotImpact - 1) * 100)
        },
        recommendation: generateRecommendation(probability, input)
    };
}