import { Helmet } from "react-helmet-async";

const SITE_URL = "https://rps.abhyasadh.com";

export default function SEO({
  title,
  description,
  path = "/",
  noindex = false,
  nofollow = false,
}) {
  const fullTitle = title ? `${title} | Rock Paper Scissors` : "Rock Paper Scissors";
  const url = `${SITE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />

      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />

      {(noindex || nofollow) && (
        <meta
          name="robots"
          content={`${noindex ? "noindex" : "index"}, ${nofollow ? "nofollow" : "follow"}`}
        />
      )}
    </Helmet>
  );
}
