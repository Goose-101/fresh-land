import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy · Fresh Land",
  description:
    "How Fresh Land collects, uses, and protects your information.",
};

const EFFECTIVE_DATE = "July 24, 2026";
const CONTACT_EMAIL = "support@freshland.cc"; // TODO: confirm this inbox is monitored

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <p className="label text-text-muted">Legal</p>
      <h1 className="text-3xl font-bold mt-1 mb-2">Privacy Policy</h1>
      <p className="text-sm text-text-muted mb-8">
        Effective date: {EFFECTIVE_DATE}
      </p>

      <div className="flex flex-col gap-6 text-sm leading-relaxed text-text-secondary">
        <p>
          This Privacy Policy explains how Fresh Land (&ldquo;we,&rdquo;
          &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses, and protects
          your information when you use freshland.cc and related services (the
          &ldquo;Service&rdquo;). We built Fresh Land to help immigrants and
          newcomers, and we take your privacy seriously. By using the Service,
          you agree to this Policy.
        </p>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            1. Information We Collect
          </h2>
          <ul className="list-disc pl-5 flex flex-col gap-1">
            <li>
              <strong>Account information</strong> you provide, such as your
              name and email address, when you sign up.
            </li>
            <li>
              <strong>Content you create</strong>, such as forum posts, replies,
              saved resources, pathway progress, and reminders.
            </li>
            <li>
              <strong>Messages to the AI assistant</strong>, which are processed
              to generate responses.
            </li>
            <li>
              <strong>Basic technical data</strong> your browser sends
              automatically, such as approximate device and usage information,
              used to keep the Service secure and working.
            </li>
          </ul>
          <p className="mt-3">
            We do not ask for immigration status, and we encourage you not to
            share sensitive personal details in public forum posts.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            2. How We Use Your Information
          </h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
            <li>provide, maintain, and improve the Service;</li>
            <li>create and secure your account;</li>
            <li>
              send reminders and Service-related emails you have set up or
              requested;
            </li>
            <li>power features like the community forum and AI assistant;</li>
            <li>prevent spam, abuse, and fraud, and comply with the law.</li>
          </ul>
          <p className="mt-3">
            We do <strong>not</strong> sell your personal information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            3. Service Providers
          </h2>
          <p>
            We use trusted third-party providers to operate the Service — for
            example, hosting and database infrastructure, email delivery,
            translation, and AI processing. These providers only access
            information as needed to perform services for us and are expected to
            protect it. Some information you submit (such as a message to the AI
            assistant, or text to be translated) is sent to these providers to
            deliver the feature.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            4. How We Protect Your Information
          </h2>
          <p>
            We use industry-standard measures, including database-level access
            controls that restrict each user&rsquo;s data to their own account.
            No system is perfectly secure, so we cannot guarantee absolute
            security, but we work to protect your information and limit access to
            it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            5. Your Choices and Rights
          </h2>
          <p>
            You can review and update your account information, delete content
            you have posted, turn off reminder emails in your settings, and
            request deletion of your account by contacting us. Depending on where
            you live, you may have additional rights over your personal
            information; contact us to exercise them.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            6. Children&rsquo;s Privacy
          </h2>
          <p>
            The Service is not directed to children under 13, and we do not
            knowingly collect personal information from them. If you believe a
            child under 13 has provided us information, contact us and we will
            delete it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            7. Changes to This Policy
          </h2>
          <p>
            We may update this Policy from time to time. We will revise the
            &ldquo;Effective date&rdquo; above and, for material changes, take
            reasonable steps to notify you. Your continued use of the Service
            after changes take effect means you accept the updated Policy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            8. Contact
          </h2>
          <p>
            Questions about your privacy? Contact us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-primary hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            . See also our{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
