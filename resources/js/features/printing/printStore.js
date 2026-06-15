import { create } from 'zustand';

export const usePrintStore = create((set) => ({
    jobs: {},
    upsertJob: (job) => set((state) => ({ jobs: { ...state.jobs, [job.job_uuid]: job } })),
}));
