import React from "react";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Terms of Service",
  description: "Learn about the terms and conditions of using our website and services.",
  path: "/terms-of-service",
});

const privacyPolicyContent = [
  {
    title: "Overview",
    content: [
      `At Kristal Graphics, we respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you visit our website at cmykprint.shop`,
    ],
  },

  {
    title: "Information We Collect",
    content: [],
  },

  {
    title: "Comments",
    content: [
      `When you leave comments on our site, we collect the data provided in the comments form, along with your IP address and browser user agent string to assist with spam detection.`,

      `If you use Gravatar for your profile picture, an anonymized string created from your email address may be shared with the Gravatar service. Their privacy policy is available at: <a href="https://automattic.com/privacy/" class="hover:text-[#f12f88]"> https://automattic.com/privacy/ </a>. Once your comment is approved, your profile picture becomes visible to the public alongside your comment.`,
    ], 
  },

  {
    title: "Media",
    content: [
      `If you upload images to our website, we recommend avoiding images with embedded location data (EXIF GPS). Website visitors can potentially download and extract location data from images on the website..`,
    ],
  },

  {
    title: "Cookies",
    content: [`Our website uses cookies for various purposes:`],
    list: [
      `Comment cookies: When leaving a comment, you may opt to save your name, email address, and website in cookies for convenience on future comments. These cookies remain active for one year.`,

      `Login cookies: When visiting our login page, a temporary cookie is set to verify browser cookie compatibility. Upon logging in, several cookies save your login information and display preferences. Login cookies last for two days, while screen options cookies last for a year. The “Remember Me” option extends login persistence to two weeks. Logging out removes all login cookies.`,

      `Content editing cookies: When editing or publishing content, a cookie storing the post ID is saved in your browser, expiring after one day.`,
    ],
  },

  {
    title: "Embedded Content",
    content: [
      `Our articles may include embedded content (videos, images, articles, etc.) from other websites. This embedded content functions as if you visited the other website directly.`,

      `These external websites may collect data about you, use cookies, employ additional third-party tracking, and monitor your interactions with their embedded content, including tracking interactions if you have an account and are logged in to their website.`,
    ],
  },

  {
    title: "Data Sharing and Security",
    content: [],
  },

  {
    title: "Who We Share Data With",
    content: [`If you request a password reset, your IP address will be included in the reset email for security purposes.`],
  },

  {
    title: "Data Retention",
    content: [
      `Comments and their metadata are retained indefinitely to facilitate automatic approval of follow-up comments and improve user experience.`,

      `For registered users, we store the personal information provided in user profiles. All users can view, edit, or delete their personal information at any time (except usernames, which cannot be changed). Website administrators can also access and edit this information.`,
    ],
  },

  {
    title: "Your Data Rights",
    content: [`If you have an account or have left comments on our site, you can:`],
    list: [`Request an exported file of the personal data we hold about you`, `Request erasure of your personal data`],
    afterList: [`Please note that we may retain certain data for administrative, legal, or security purposes as required.`],
  },

  {
    title: "Third-Party Services",
    content: [`Visitor comments may be checked through automated spam detection services to maintain website security and quality.`],
  },

  {
    title: "Changes to This Policy",
    content: [
      `We may update our privacy policy from time to time. We encourage you to review this page periodically for any changes. Changes to this privacy policy are effective when posted on this page.`,
    ],
  },
];

export const page = () => {
  return (
    <div>
      <section className="overflow-hidden max-w-screen">
        <div className="bg-[url('https://wp.cmykprint.shop/wp-content/uploads/2025/11/Frame-1.png.webp')] max-w-screen h-4"></div>
        <div className="bg-[url('https://wp.cmykprint.shop/wp-content/uploads/2025/11/Group-13-scaled.png.webp')] bg-center px-6 py-24 sm:py-32 md:py-24">
          <div className="mx-auto flex justify-center gap-6 text-center text-4xl sm:text-5xl md:text-7xl">
            <span className="font-bold font-heading text-white">Privacy Policy</span>
          </div>
        </div>
        <div className="bg-[url('https://wp.cmykprint.shop/wp-content/uploads/2025/11/Frame-1.png.webp')] max-w-screen h-4"></div>
        {/* Terms content */}
        <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 lg:px-12">
          <div className="max-w-6xl">
            {privacyPolicyContent.map((section, index) => (
              <section
                key={index}
                className="mb-12"
              >
                <h2 className="mb-6 text-3xl  text-neutral-800">{section.title}</h2>

                <div className="space-y-6">
                  {section.content?.map((paragraph, i) => (
                    <p
                      key={i}
                      className="text-lg leading-8 text-neutral-600"
                      dangerouslySetInnerHTML={{ __html: paragraph.replace(/\n/g, "<br />") }}
                    >
                    </p>
                  ))}

                  {section.list && (
                    <ul className="list-disc space-y-3 pl-6 text-lg leading-8 text-neutral-600">
                      {section.list.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}

                  {section.afterList?.map((paragraph, i) => (
                    <p
                      key={i}
                      className="text-lg leading-8 text-neutral-600"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
};

export default page;
