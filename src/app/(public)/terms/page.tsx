import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service · Fresh Land",
  description:
    "The terms and conditions that govern your use of Fresh Land, a free guide to essential services for immigrants and newcomers.",
};

// Update this whenever the terms change (see Section 11).
const EFFECTIVE_DATE = "July 24, 2026";
const CONTACT_EMAIL = "support@freshland.cc"; // TODO: confirm this inbox is monitored

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <p className="label text-text-muted">Legal</p>
      <h1 className="text-3xl font-bold mt-1 mb-2">Terms of Service</h1>
      <p className="text-sm text-text-muted mb-8">
        Effective date: {EFFECTIVE_DATE}
      </p>

      <div className="prose-legal flex flex-col gap-6 text-sm leading-relaxed text-text-secondary">
        <p>
          Welcome to Fresh Land. These Terms of Service (&ldquo;Terms&rdquo;)
          are a binding agreement between you (&ldquo;you&rdquo; or the
          &ldquo;user&rdquo;) and Fresh Land (&ldquo;Fresh Land,&rdquo;
          &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) and govern
          your access to and use of the Fresh Land website at freshland.cc and
          any related services (together, the &ldquo;Service&rdquo;). By
          creating an account, browsing, or otherwise using the Service, you
          agree to these Terms. If you do not agree, please do not use the
          Service.
        </p>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            1. What Fresh Land Is (and Is Not)
          </h2>
          <p>
            Fresh Land is a <strong>free</strong> informational platform that
            helps immigrants and newcomers find essential services. The Service
            includes a directory of third-party resources, a community forum, a
            guided settlement pathway, reminders, and an AI assistant.
          </p>
          <p className="mt-3">
            <strong>
              Fresh Land is not a law firm, immigration consultancy, medical
              provider, financial advisor, or government agency, and using the
              Service does not create any attorney-client, medical, or
              professional relationship.
            </strong>{" "}
            Information on the Service is provided for general educational
            purposes only and is <strong>not</strong> legal, immigration,
            medical, financial, or other professional advice. Immigration and
            legal matters are fact-specific and change over time. Always confirm
            information with the relevant organization and consult a qualified,
            licensed professional before acting on anything you find here. For
            emergencies, call 9-1-1.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            2. Eligibility and Accounts
          </h2>
          <p>
            The Service is not directed to children under 13, and you may not
            use it or create an account if you are under 13. If you are between
            13 and 18, you may use the Service only with the involvement of a
            parent or guardian. When you create an account, you agree to provide
            accurate information, keep your login credentials confidential, and
            accept responsibility for all activity under your account. Notify us
            promptly at {CONTACT_EMAIL} if you suspect unauthorized use.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            3. No Fees
          </h2>
          <p>
            Fresh Land is free to use. We do not charge for access to the
            Service and do not sell products through it. If we ever introduce a
            paid feature, we will describe its price and terms clearly before
            you are charged, and those terms will be optional and separate from
            this free Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            4. Third-Party Resources and Links
          </h2>
          <p>
            The directory lists organizations, programs, and websites that Fresh
            Land does not own or control. We work to keep listings accurate and
            &ldquo;verified,&rdquo; but we do not guarantee that any hours,
            eligibility rules, contact details, availability, or services are
            current or correct. We do not endorse, and are not responsible for,
            any third party or the services they provide. Any dealings you have
            with a listed organization are solely between you and that
            organization.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            5. AI Assistant
          </h2>
          <p>
            The Service may include an AI assistant that generates responses
            automatically. AI output can be incomplete, outdated, or incorrect,
            and it is <strong>not</strong> a substitute for professional advice
            or official sources. Do not rely on the AI assistant for legal,
            immigration, medical, or financial decisions. Verify anything
            important with a qualified professional or the responsible agency.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            6. User Content
          </h2>
          <p>
            The community forum lets you post messages, replies, and other
            content (&ldquo;User Content&rdquo;). You retain ownership of your
            User Content. By posting, you grant Fresh Land a non-exclusive,
            royalty-free, worldwide license to host, display, and distribute
            that content for the purpose of operating and promoting the Service.
          </p>
          <p className="mt-3">
            You are solely responsible for what you post, and you represent that
            you have the right to post it. Fresh Land does not endorse and is
            not responsible for User Content, and we may remove any content or
            suspend accounts at our discretion, but we are not obligated to
            monitor or review content.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            7. Rules of Conduct
          </h2>
          <p>You agree not to use the Service to:</p>
          <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
            <li>
              post content that is unlawful, harassing, hateful, threatening,
              defamatory, or that harms or endangers others;
            </li>
            <li>
              post false, misleading, or fraudulent information, or impersonate
              any person or organization;
            </li>
            <li>
              share others&rsquo; private or personal information without
              permission;
            </li>
            <li>
              spam, scrape, overload, or attempt to disrupt or gain unauthorized
              access to the Service or its systems;
            </li>
            <li>
              violate any applicable law or infringe anyone&rsquo;s
              intellectual property or other rights.
            </li>
          </ul>
          <p className="mt-3">
            We may warn, suspend, or permanently remove users who violate these
            rules.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            8. Intellectual Property
          </h2>
          <p>
            The Service and its original content, features, design, logo, text,
            and graphics (excluding User Content and third-party materials) are
            owned by Fresh Land and protected by intellectual property laws. You
            may use the Service for its intended personal, non-commercial
            purpose. You may not copy, reproduce, distribute, or create
            derivative works from our materials without our prior written
            permission.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            9. Disclaimer of Warranties
          </h2>
          <p>
            The Service is provided &ldquo;as is&rdquo; and &ldquo;as
            available,&rdquo; without warranties of any kind, whether express or
            implied, including warranties of accuracy, merchantability, fitness
            for a particular purpose, and non-infringement. We do not warrant
            that the Service will be uninterrupted, secure, error-free, or that
            any information provided through it is accurate or complete.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            10. Limitation of Liability
          </h2>
          <p>
            To the fullest extent permitted by law, Fresh Land and its founder,
            operators, and contributors will not be liable for any indirect,
            incidental, special, consequential, or punitive damages, or for any
            loss arising out of or related to your use of (or inability to use)
            the Service, your reliance on any information or User Content, or
            your dealings with any third-party organization listed on the
            Service. This applies even if we have been advised of the
            possibility of such damages. Some jurisdictions do not allow certain
            limitations, so some of these may not apply to you.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            11. Changes to These Terms
          </h2>
          <p>
            We may update these Terms from time to time to reflect changes to
            the Service or the law. When we do, we will revise the
            &ldquo;Effective date&rdquo; above and, for material changes, take
            reasonable steps to notify you (for example, by a notice on the
            Service or by email). Your continued use of the Service after changes
            take effect means you accept the updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            12. Termination
          </h2>
          <p>
            You may stop using the Service and delete your account at any time.
            We may suspend or terminate your access if you violate these Terms or
            if we discontinue the Service. Sections that by their nature should
            survive termination (including Sections 4, 6, 8, 9, 10, and 13) will
            continue to apply.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            13. Governing Law
          </h2>
          <p>
            These Terms are governed by the laws of the State of Georgia and the
            United States, without regard to conflict-of-law principles. Any
            dispute relating to these Terms or the Service will be brought in the
            state or federal courts located in Georgia, and you consent to their
            jurisdiction, except where prohibited by applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            14. Privacy
          </h2>
          <p>
            Your use of the Service is also governed by our{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            , which explains what information we collect and how we use it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            15. Contact
          </h2>
          <p>
            Questions about these Terms? Contact us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-primary hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
