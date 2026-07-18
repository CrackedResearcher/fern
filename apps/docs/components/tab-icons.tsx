/**
 * Nav tab icons, taken verbatim from their rendered docs markup — the open
 * book for Getting Started and the four-node cluster for Components.
 *
 * Transcribed from their served HTML rather than substituted from an icon set:
 * the earlier gravity-ui stand-ins were the right idea and the wrong glyphs,
 * which is exactly the kind of near-miss that reads as "close but not it".
 */

export function BookIcon() {
  return (
    <svg aria-hidden height="1em" width="1em" role="img" viewBox="0 0 16 16">
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.345 2.634q.136.069.268.145L8 3l.387-.221q.133-.076.268-.145a6.7 6.7 0 0 1 6.052-.03c.486.242.793.74.793 1.283v8.938c0 .65-.526 1.175-1.175 1.175h-.04c-.187 0-.37-.05-.529-.146a4.8 4.8 0 0 0-4.61-.177l-.199.1A2.1 2.1 0 0 1 8 14h-.117a1.6 1.6 0 0 1-.726-.171l-.233-.117a4.94 4.94 0 0 0-4.748.183a.74.74 0 0 1-.381.105h-.12A1.175 1.175 0 0 1 .5 12.825V3.887c0-.543.307-1.04.793-1.284a6.7 6.7 0 0 1 6.052.03m1.405 9.572V4.3l.382-.218A5.2 5.2 0 0 1 14 3.927v8.357a6.3 6.3 0 0 0-5.25-.078m-1.5.005V4.299l-.382-.218A5.2 5.2 0 0 0 2 3.927v8.365a6.44 6.44 0 0 1 5.25-.082"
      />
    </svg>
  )
}

export function ComponentsIcon() {
  return (
    <svg aria-hidden height="1em" width="1em" role="img" viewBox="0 0 16 16" fill="none">
      <path
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.502 4.392a2.75 2.75 0 1 0-5.004-2.285a2.75 2.75 0 0 0 5.004 2.285m-4.75 2.466a2.76 2.76 0 0 0-1.36-1.36a2.75 2.75 0 1 0 1.36 1.36m1.106 3.39a2.76 2.76 0 0 0-1.36 1.36a2.75 2.75 0 1 0 1.36-1.36m3.39-1.106a2.75 2.75 0 0 0 1.36 1.36a2.75 2.75 0 1 0-1.36-1.36M8 2a1.25 1.25 0 1 0 0 2.5A1.25 1.25 0 0 0 8 2m6 6a1.25 1.25 0 1 0-2.5 0A1.25 1.25 0 0 0 14 8m-6 3.5A1.25 1.25 0 1 0 8 14a1.25 1.25 0 0 0 0-2.5M4.5 8A1.25 1.25 0 1 0 2 8a1.25 1.25 0 0 0 2.5 0"
      />
    </svg>
  )
}
