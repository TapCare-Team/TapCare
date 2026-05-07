import type { FollowUpSignal } from "@/modules/signals/domain/follow-up-signal";

export class MockFollowUpStateRepository {
  async syncDerivedSignals(_signals: FollowUpSignal[]) {}

  async listSignalStatesByIds(_signalIds: string[]) {
    return [];
  }

  async getSignalStateById(_signalId: string) {
    return null;
  }

  async listLatestReviewsBySignalIds(_signalIds: string[]) {
    return [];
  }

  async applyReview() {}
}
