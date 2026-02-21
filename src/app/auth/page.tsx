import Link from "next/link";

type AuthPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const next = params.next && params.next.startsWith("/") ? params.next : "/dashboard";
  const encodedNext = encodeURIComponent(next);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--sea-mist)",
        padding: 24,
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 540,
          background: "var(--cloud)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
          padding: 32,
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 34,
            fontWeight: 800,
            color: "var(--ink)",
            marginBottom: 8,
          }}
        >
          Access your platform
        </h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
          Continue with trial, paid account, or test an expired-trial path.
        </p>

        <div style={{ display: "grid", gap: 12 }}>
          <Link
            href={`/api/mock-auth?mode=trial&next=${encodedNext}`}
            style={{
              background: "var(--ocean-500)",
              color: "white",
              textDecoration: "none",
              fontWeight: 700,
              padding: "12px 16px",
              textAlign: "center",
            }}
          >
            Start 14-day trial
          </Link>
          <Link
            href={`/api/mock-auth?mode=paid&next=${encodedNext}`}
            style={{
              background: "var(--sage)",
              color: "white",
              textDecoration: "none",
              fontWeight: 700,
              padding: "12px 16px",
              textAlign: "center",
            }}
          >
            Sign in as paid user
          </Link>
          <Link
            href={`/api/mock-auth?mode=expired&next=${encodedNext}`}
            style={{
              background: "var(--amber)",
              color: "white",
              textDecoration: "none",
              fontWeight: 700,
              padding: "12px 16px",
              textAlign: "center",
            }}
          >
            Simulate expired trial
          </Link>
          <Link
            href="/"
            style={{
              border: "1px solid var(--border)",
              color: "var(--ink-mid)",
              textDecoration: "none",
              fontWeight: 700,
              padding: "12px 16px",
              textAlign: "center",
            }}
          >
            Back to marketing site
          </Link>
        </div>
      </section>
    </main>
  );
}
