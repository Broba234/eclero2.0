// components/RoleChoiceSection.tsx
import { BookOpen } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

type RoleCardVariant = "primary" | "secondary";

interface RoleCardProps {
  variant: RoleCardVariant;
  icon: string;
  icon2?: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
}

function RoleCard({
  variant,
  icon,
  icon2,
  title,
  description,
  ctaLabel,
  href,
}: RoleCardProps) {
  const isPrimary = variant === "primary";

  return (
    <>
      <div className={[
    "group flex flex-col items-start justify-between rounded-se-[80px] rounded-es-[80px] p-8 transition-all",
    "border border-transparent shadow-lg",
    "hover:-translate-y-1 hover:shadow-xl space-y-4",
    isPrimary
      ? "bg-[#1559C6]/80 text-white"
      : "bg-white text-slate-900 border-slate-100",
  ].join(" ")}>
        <div
          className={[
            "inline-flex h-16 w-16 items-center justify-center",
            isPrimary
              ? "border-emerald-100 text-white"
              : "border-orange-200 text-orange-500",
          ].join(" ")}
        >
          <Image src={icon} alt={title} width={58} height={58} className="" />
         
        </div>
        <div className="space-y-1 text-left">
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
          <p
            className={[
              "text-sm leading-relaxed",
              isPrimary ? "text-emerald-50/90" : "text-slate-500",
            ].join(" ")}
          >
            {description}
          </p>
        </div>
      
  <Link
  href={href}
  
>
    
      <button
        className={[
          "mt-8 inline-flex items-center justify-center rounded-full px-6 py-2 text-sm font-medium transition-colors",
          isPrimary
            ? "bg-orange-400 text-white hover:bg-orange-500"
            : "bg-[#345267] text-white hover:bg-[#345267]/80",
        ].join(" ")}
      >
         {!icon2 && <BookOpen className="h-5 w-5" />}
         {icon2 && <Image src={icon2} alt={title} width={28} height={28} className="" />}
        <span className="ml-2">{ctaLabel}</span>
      </button>
      </Link>
      </div>
    </>
  );
}

export default function RoleChoiceSection() {
  return (
    <section className="w-full bg-slate-50 py-[150px]">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          What You Looking for?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-500 sm:text-base">
          Our dynamic educational platform offers you the tools and resources
          to propel yourself towards a brighter future.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <RoleCard
            variant="secondary"
            icon='/teacher.png'
            icon2='/dollar.svg'
            title="Do You Want to Teach Here"
            description="Our dynamic educational platform offers you the tools and a supportive community to share your expertise."
            ctaLabel="Start Earning"
            href="/home/tutor/profile" // adjust to your route
          />

          <RoleCard
            variant="primary"
            icon='/student.svg'
            title="Do You Want Learn Here"
            description="Gain access to curated lessons, real-time support, and a vibrant community of learners."
            ctaLabel="Start Learning"
            href="/home/student/explore" // adjust to your route
          />
        </div>
      </div>
    </section>
  );
}