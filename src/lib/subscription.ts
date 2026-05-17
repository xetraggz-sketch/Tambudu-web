export function isSubscriber(user: {
  subscriptionUntil: Date | null;
}): boolean {
  return (
    !!user.subscriptionUntil && new Date(user.subscriptionUntil) > new Date()
  );
}
