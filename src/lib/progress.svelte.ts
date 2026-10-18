class ProgressTracker {
	completedSlugs = $state<string[]>([]);

	constructor() {
		if (typeof window !== 'undefined' && window.localStorage) {
			const saved = window.localStorage.getItem('python_ai_lab_completed');
			if (saved) {
				try {
					this.completedSlugs = JSON.parse(saved);
				} catch {
					this.completedSlugs = [];
				}
			}
		}
	}

	isCompleted(slug: string): boolean {
		return this.completedSlugs.includes(slug);
	}

	toggleCompleted(slug: string): void {
		if (this.completedSlugs.includes(slug)) {
			this.completedSlugs = this.completedSlugs.filter((s) => s !== slug);
		} else {
			this.completedSlugs = [...this.completedSlugs, slug];
		}
		this._persist();
	}

	markCompleted(slug: string): void {
		if (!this.completedSlugs.includes(slug)) {
			this.completedSlugs = [...this.completedSlugs, slug];
			this._persist();
		}
	}

	private _persist(): void {
		if (typeof window !== 'undefined' && window.localStorage) {
			window.localStorage.setItem('python_ai_lab_completed', JSON.stringify(this.completedSlugs));
		}
	}
}

export const progress = new ProgressTracker();
