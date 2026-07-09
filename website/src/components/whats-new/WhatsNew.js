import News from "@/components/base/news";

import clientBasedAccessNews from "./clientBasedAccessNews";
import { getResolvedWhatsNew, isExpired } from "./utils";

export default function WhatsNew() {
  const resolvedNews = getResolvedWhatsNew(clientBasedAccessNews);

  if (!resolvedNews.active || isExpired(resolvedNews)) {
    return null;
  }

  return (
    <News
      newsId={resolvedNews.newsId}
      slides={resolvedNews.slides}
    />
  );
}
