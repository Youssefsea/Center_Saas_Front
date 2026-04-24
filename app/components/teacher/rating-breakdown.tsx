type ReviewItem = {
  rating: number;
};

export function RatingBreakdown({ reviews }: { reviews: ReviewItem[] }) {
  const total = reviews.length || 1;
  const breakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((review) => review.rating === star).length;
    return { star, count, percent: (count / total) * 100 };
  });

  return (
    <div className="space-y-2">
      {breakdown.map((item) => (
        <div key={item.star} className="flex items-center gap-3 text-sm">
          <span>{item.star}★</span>
          <div className="h-2 flex-1 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-accent"
              style={{ width: `${item.percent}%` }}
            />
          </div>
          <span className="text-muted">{item.count}</span>
        </div>
      ))}
    </div>
  );
}
