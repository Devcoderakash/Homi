import Link from "next/link";
import { Header, Footer } from "@/components/site";
import { ArrowLeft, Shield, FileText, CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";

export const metadata = {
  title: "Terms of Service — homi.",
  description: "Terms and Conditions governing the use of the Homi on-demand household service platform in India.",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f8faf7] py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Back Navigation */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#3b6744] hover:text-[#184e3f] mb-8 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>

          {/* Header Card */}
          <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-[#e8eee7] mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="p-2.5 rounded-xl bg-[#eef7ee] text-[#285437]">
                <FileText size={28} />
              </span>
              <div>
                <span className="text-xs font-bold tracking-wider uppercase text-[#5b6b63]">Legal Agreement</span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#123b30] mt-0.5">
                  Terms of Service
                </h1>
              </div>
            </div>
            <p className="text-sm text-[#5b6b63] leading-relaxed">
              Last Updated: November 2026 • Effective Date: November 23, 2026
            </p>
            <p className="text-sm text-[#405449] mt-3 leading-relaxed">
              Welcome to <strong>homi.</strong> (&quot;Homi&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Homi website, mobile applications, and technology platform that connects Indian households with local independent home-service workers.
            </p>
            <div className="mt-4 p-4 rounded-xl bg-[#f2f8ed] border border-[#dcebd8] flex items-start gap-3">
              <Shield className="text-[#3b6744] shrink-0 mt-0.5" size={20} />
              <p className="text-xs text-[#285437] leading-relaxed">
                <strong>Important Notice:</strong> By submitting a service request, registering as an independent worker, or accessing any part of Homi, you acknowledge that you have read, understood, and agreed to be bound by these Terms and our <Link href="/privacy" className="underline font-bold hover:text-[#184e3f]">Privacy Policy</Link>.
              </p>
            </div>
          </div>

          {/* Detailed Terms Sections */}
          <div className="space-y-6">
            {/* Section 1 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#e8eee7]">
              <h2 className="text-lg font-bold text-[#123b30] mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#eef7ee] text-[#285437] text-xs font-bold flex items-center justify-center">1</span>
                Intermediary Platform Model
              </h2>
              <div className="text-sm text-[#4a5f53] space-y-3 leading-relaxed">
                <p>
                  Homi operates solely as an <strong>intermediary technology platform</strong> under Section 79 of the Information Technology Act, 2000 and applicable Indian laws.
                </p>
                <p>
                  Homi is <strong>not</strong> an employer, contractor, agent, or guarantor of independent service workers (plumbers, electricians, carpenters, painters, appliance technicians, or cleaners). All workers listed on or matched through Homi are independent third-party service providers.
                </p>
                <p>
                  Any agreement for the provision of household work, pricing, scope, warranty, or quality of service is entered into <strong>directly between the customer and the service worker</strong>.
                </p>
              </div>
            </div>

            {/* Section 2 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#e8eee7]">
              <h2 className="text-lg font-bold text-[#123b30] mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#eef7ee] text-[#285437] text-xs font-bold flex items-center justify-center">2</span>
                Service Requests &amp; Communication
              </h2>
              <div className="text-sm text-[#4a5f53] space-y-3 leading-relaxed">
                <p>
                  Customers may submit household repair and service requests without prior account registration by providing their locality, service requirements, and a valid Indian mobile number.
                </p>
                <p>
                  By submitting a request, you grant Homi permission to share your locality, category requirement, and job description with qualified local technicians, and to share your contact details once a technician is assigned or expresses availability.
                </p>
                <p>
                  You agree to receive service-related transactional communications via SMS, WhatsApp, phone calls, or email from Homi and assigned technicians solely for fulfilling your requested service.
                </p>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#e8eee7]">
              <h2 className="text-lg font-bold text-[#123b30] mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#eef7ee] text-[#285437] text-xs font-bold flex items-center justify-center">3</span>
                Pricing, Quotations &amp; Direct Offline Payments
              </h2>
              <div className="text-sm text-[#4a5f53] space-y-3 leading-relaxed">
                <p>
                  <strong>No Upfront Platform Payment:</strong> Homi does not charge customers an upfront service booking fee.
                </p>
                <p>
                  <strong>Cost Estimates &amp; Quotations:</strong> Any price estimate or quotation displayed on Homi or provided by a worker is an estimate based on the described issue. Final prices may be mutually agreed upon inspection of the premises.
                </p>
                <p>
                  <strong>Direct Settlement:</strong> Unless explicitly facilitated through an authorized platform payment link, all service fees and materials costs are settled directly between you and the service worker via cash, UPI, or other mutually agreed payment methods.
                </p>
              </div>
            </div>

            {/* Section 4 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#e8eee7]">
              <h2 className="text-lg font-bold text-[#123b30] mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#eef7ee] text-[#285437] text-xs font-bold flex items-center justify-center">4</span>
                Independent Worker Applications &amp; Verification
              </h2>
              <div className="text-sm text-[#4a5f53] space-y-3 leading-relaxed">
                <p>
                  Individuals applying to join Homi as service professionals (&quot;Partners&quot; or &quot;Workers&quot;) must provide accurate personal, professional, and identification documents (such as Aadhaar, PAN, Voter ID, or Driving License).
                </p>
                <p>
                  Partner documents are collected strictly for identity verification, safety checks, and fraud prevention in accordance with the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>. Partner identity documents are stored in private, encrypted storage and are never exposed publicly.
                </p>
                <p>
                  Homi reserves the right to accept, reject, suspend, or terminate any worker application or profile at its sole discretion for security, compliance, or quality concerns.
                </p>
              </div>
            </div>

            {/* Section 5 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#e8eee7]">
              <h2 className="text-lg font-bold text-[#123b30] mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#eef7ee] text-[#285437] text-xs font-bold flex items-center justify-center">5</span>
                Customer Safety &amp; On-Site Conduct
              </h2>
              <div className="text-sm text-[#4a5f53] space-y-3 leading-relaxed">
                <p>
                  Customers must ensure a safe and secure environment for technicians entering their premises.
                </p>
                <p>
                  We recommend that customers have an adult present during the service visit and verify the technician&apos;s identity before granting entry.
                </p>
                <p>
                  Harassment, abusive language, discrimination, or unsafe working conditions directed toward workers or Homi staff will result in immediate termination of platform access.
                </p>
              </div>
            </div>

            {/* Section 6 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#e8eee7]">
              <h2 className="text-lg font-bold text-[#123b30] mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#eef7ee] text-[#285437] text-xs font-bold flex items-center justify-center">6</span>
                Limitation of Liability &amp; Disclaimers
              </h2>
              <div className="text-sm text-[#4a5f53] space-y-3 leading-relaxed">
                <p>
                  The platform is provided on an <em>&quot;as is&quot;</em> and <em>&quot;as available&quot;</em> basis without warranties of any kind, whether express or implied.
                </p>
                <p>
                  To the maximum extent permitted by Indian law, Homi disclaims all liability for any indirect, incidental, special, consequential, or punitive damages, including property damage, personal injury, loss of data, or service delays arising from worker conduct or household repair work.
                </p>
              </div>
            </div>

            {/* Section 7 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#e8eee7]">
              <h2 className="text-lg font-bold text-[#123b30] mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#eef7ee] text-[#285437] text-xs font-bold flex items-center justify-center">7</span>
                Privacy &amp; Data Protection
              </h2>
              <div className="text-sm text-[#4a5f53] space-y-3 leading-relaxed">
                <p>
                  Your privacy is paramount. Personal data collected through Homi is processed in strict compliance with the <strong>Digital Personal Data Protection Act, 2023</strong> and the <strong>DPDP Rules, 2025</strong>.
                </p>
                <p>
                  Please review our full <Link href="/privacy" className="text-[#285437] font-bold underline hover:text-[#184e3f]">Privacy Policy</Link> to understand how we collect, use, store, and protect your information, as well as how to exercise your rights of access, correction, erasure, and grievance redressal.
                </p>
              </div>
            </div>

            {/* Section 8 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#e8eee7]">
              <h2 className="text-lg font-bold text-[#123b30] mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#eef7ee] text-[#285437] text-xs font-bold flex items-center justify-center">8</span>
                Governing Law &amp; Dispute Resolution
              </h2>
              <div className="text-sm text-[#4a5f53] space-y-3 leading-relaxed">
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the Republic of India.
                </p>
                <p>
                  Any dispute, claim, or controversy arising out of or relating to these Terms or the breach thereof shall be subject to the exclusive jurisdiction of the competent courts located in Bhopal, Madhya Pradesh, India.
                </p>
              </div>
            </div>

            {/* Section 9 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#e8eee7]">
              <h2 className="text-lg font-bold text-[#123b30] mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#eef7ee] text-[#285437] text-xs font-bold flex items-center justify-center">9</span>
                Grievance Officer &amp; Contact Information
              </h2>
              <div className="text-sm text-[#4a5f53] space-y-3 leading-relaxed">
                <p>
                  In accordance with the Information Technology Act, 2000, the Consumer Protection (E-Commerce) Rules, 2020, and the Digital Personal Data Protection Act, 2023, the details of our designated Grievance Officer can be found on our <Link href="/privacy" className="text-[#285437] font-bold underline hover:text-[#184e3f]">Privacy &amp; Grievance Redressal Page</Link> or by contacting:
                </p>
                <div className="p-4 rounded-xl bg-[#f8faf7] border border-[#e8eee7] text-xs text-[#31553c] space-y-1">
                  <p><strong>Grievance Redressal Cell — Homi Platform</strong></p>
                  <p>Email: <a href="mailto:grievance@homi.local" className="underline font-medium">grievance@homi.local</a> (or privacy@homi.local)</p>
                  <p>Response Timeline: Acknowledgement within 24 hours; resolution within 30 days as prescribed under applicable Indian rules.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
