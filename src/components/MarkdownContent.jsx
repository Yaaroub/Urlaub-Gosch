import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownContent({
  content = "",
  className = "",
}) {
  const value =
    typeof content === "string"
      ? content.trim()
      : "";

  if (!value) {
    return null;
  }

  return (
    <div
      className={[
        "markdown-content text-[15px] leading-7 text-slate-700",
        className,
      ].join(" ")}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1({ children }) {
            return (
              <h2 className="mb-3 mt-7 text-2xl font-bold tracking-tight text-slate-950 first:mt-0">
                {children}
              </h2>
            );
          },

          h2({ children }) {
            return (
              <h3 className="mb-3 mt-7 text-xl font-bold tracking-tight text-slate-950 first:mt-0">
                {children}
              </h3>
            );
          },

          h3({ children }) {
            return (
              <h4 className="mb-2 mt-6 text-lg font-semibold text-slate-950 first:mt-0">
                {children}
              </h4>
            );
          },

          h4({ children }) {
            return (
              <h5 className="mb-2 mt-5 font-semibold text-slate-900">
                {children}
              </h5>
            );
          },

          p({ children }) {
            return (
              <p className="mb-4 last:mb-0">
                {children}
              </p>
            );
          },

          strong({ children }) {
            return (
              <strong className="font-bold text-slate-950">
                {children}
              </strong>
            );
          },

          em({ children }) {
            return (
              <em className="italic text-slate-700">
                {children}
              </em>
            );
          },

          ul({ children }) {
            return (
              <ul className="mb-4 ml-5 list-disc space-y-1.5 marker:text-sky-600">
                {children}
              </ul>
            );
          },

          ol({ children }) {
            return (
              <ol className="mb-4 ml-5 list-decimal space-y-1.5 marker:font-semibold marker:text-sky-700">
                {children}
              </ol>
            );
          },

          li({ children }) {
            return (
              <li className="pl-1">
                {children}
              </li>
            );
          },

          blockquote({ children }) {
            return (
              <blockquote className="my-5 rounded-r-xl border-l-4 border-sky-300 bg-sky-50/70 px-4 py-3 text-slate-700">
                {children}
              </blockquote>
            );
          },

          a({ href, children }) {
            const external =
              typeof href === "string" &&
              /^https?:\/\//i.test(href);

            return (
              <a
                href={href}
                {...(external
                  ? {
                      target: "_blank",
                      rel: "noopener noreferrer",
                    }
                  : {})}
                className="font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4 transition hover:text-sky-900"
              >
                {children}
              </a>
            );
          },

          hr() {
            return (
              <hr className="my-6 border-0 border-t border-slate-200" />
            );
          },

          table({ children }) {
            return (
              <div className="my-5 overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                  {children}
                </table>
              </div>
            );
          },

          thead({ children }) {
            return (
              <thead className="bg-slate-50 text-slate-900">
                {children}
              </thead>
            );
          },

          tbody({ children }) {
            return (
              <tbody className="divide-y divide-slate-100">
                {children}
              </tbody>
            );
          },

          tr({ children }) {
            return (
              <tr className="divide-x divide-slate-100">
                {children}
              </tr>
            );
          },

          th({ children }) {
            return (
              <th className="px-4 py-3 font-semibold">
                {children}
              </th>
            );
          },

          td({ children }) {
            return (
              <td className="px-4 py-3 align-top text-slate-700">
                {children}
              </td>
            );
          },

          code({ children }) {
            return (
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-slate-900">
                {children}
              </code>
            );
          },

          pre({ children }) {
            return (
              <pre className="my-5 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">
                {children}
              </pre>
            );
          },
        }}
      >
        {value}
      </ReactMarkdown>
    </div>
  );
}