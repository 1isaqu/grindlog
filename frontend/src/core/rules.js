
// --- Training Rules & Thresholds ---

export const TRAINING_RULES = {
    VOLUME: {
        OVERREACHING_MULTIPLIER: 1.3,
        LOW_CONSISTENCY_MULTIPLIER: 0.7
    },
    INTENSITY: {
        HIGH_RPE_THRESHOLD: 9,
        CONSECUTIVE_HIGH_INTENSITY_SESSIONS: 3
    }
};

export const getVolumeStatus = (current, baseline) => {
    if (baseline === 0) return 'neutral';
    if (current > baseline * TRAINING_RULES.VOLUME.OVERREACHING_MULTIPLIER) return 'overreaching';
    if (current < baseline * TRAINING_RULES.VOLUME.LOW_CONSISTENCY_MULTIPLIER) return 'low_consistency';
    return 'optimal';
};
