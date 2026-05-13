import { Heading, Body, Label, Companion } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/* -------------------------------------------------------------------------- */
/*  Colour swatch data                                                          */
/* -------------------------------------------------------------------------- */

const palette = [
  {
    group: "Cream",
    swatches: [
      { name: "cream-50", hex: "#FDFBF7", token: "bg-cream-50", text: "text-slate-warm" },
      { name: "cream-100", hex: "#F9F5EE", token: "bg-cream-100", text: "text-slate-warm" },
      { name: "cream-200", hex: "#F0E9DA", token: "bg-cream-200", text: "text-slate-warm" },
    ],
  },
  {
    group: "Sage",
    swatches: [
      { name: "sage-100", hex: "#E8EFE4", token: "bg-sage-100", text: "text-slate-warm" },
      { name: "sage-200", hex: "#C9DBC2", token: "bg-sage-200", text: "text-slate-warm" },
      { name: "sage-400", hex: "#87AA7E", token: "bg-sage-400", text: "text-cream-50" },
      { name: "sage-600", hex: "#4E7A44", token: "bg-sage-600", text: "text-cream-50" },
      { name: "sage-800", hex: "#2C4827", token: "bg-sage-800", text: "text-cream-50" },
    ],
  },
  {
    group: "Slate",
    swatches: [
      { name: "slate-warm", hex: "#4A4A45", token: "bg-slate-warm", text: "text-cream-50" },
      { name: "slate-muted", hex: "#7A7A74", token: "bg-slate-muted", text: "text-cream-50" },
      { name: "slate-hint", hex: "#ADADAA", token: "bg-slate-hint", text: "text-slate-warm" },
    ],
  },
  {
    group: "Sky",
    swatches: [
      { name: "sky-soft", hex: "#EAF2F8", token: "bg-sky-soft", text: "text-slate-warm" },
      { name: "sky-mid", hex: "#A8C8E0", token: "bg-sky-mid", text: "text-slate-warm" },
      { name: "sky-deep", hex: "#4A8AB5", token: "bg-sky-deep", text: "text-cream-50" },
    ],
  },
  {
    group: "Amber",
    swatches: [
      { name: "amber-warm", hex: "#F2A65A", token: "bg-amber-warm", text: "text-slate-warm" },
      { name: "amber-glow", hex: "#E8845A", token: "bg-amber-glow", text: "text-cream-50" },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Section wrapper                                                             */
/* -------------------------------------------------------------------------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div className="border-b border-border pb-3">
        <Heading as="h2" size="md">
          {title}
        </Heading>
      </div>
      {children}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                        */
/* -------------------------------------------------------------------------- */

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-cream-50">
      {/* Dev warning banner */}
      <div className="bg-red-600 text-white text-center py-2 px-8 font-sans text-sm font-medium">
        Dev reference only — remove before launch
      </div>

      <main className="max-w-4xl mx-auto px-8 py-16 space-y-20">
        <header className="space-y-4">
          <Heading as="h1" size="xl">
            Serene Design System
          </Heading>
          <Body muted>
            All colours, type styles, and components in one place.
          </Body>
        </header>

        {/* ------------------------------------------------------------------ */}
        {/* 1. Colour palette                                                   */}
        {/* ------------------------------------------------------------------ */}
        <Section title="1 · Colour Palette">
          <div className="space-y-8">
            {palette.map((group) => (
              <div key={group.group} className="space-y-3">
                <Label>{group.group}</Label>
                <div className="flex flex-wrap gap-3">
                  {group.swatches.map((s) => (
                    <div key={s.name} className="space-y-2 w-28">
                      <div
                        className={`h-16 w-full rounded-lg ${s.token} border border-border flex items-end p-2`}
                      >
                        <span
                          className={`font-sans text-xs leading-none ${s.text}`}
                        >
                          {s.hex}
                        </span>
                      </div>
                      <Body size="sm" muted>
                        {s.name}
                      </Body>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* 2. Typography scale                                                  */}
        {/* ------------------------------------------------------------------ */}
        <Section title="2 · Typography Scale">
          <div className="space-y-10">
            <div className="space-y-4">
              <Label>Headings — Instrument Serif, weight 500</Label>
              <div className="space-y-3 bg-cream-100 rounded-lg p-8">
                <Heading as="h1" size="xl">Heading XL — 36px</Heading>
                <Heading as="h2" size="lg">Heading LG — 30px</Heading>
                <Heading as="h3" size="md">Heading MD — 24px</Heading>
                <Heading as="h4" size="sm">Heading SM — 20px</Heading>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Body — DM Sans, min 16px, line-height 1.7</Label>
              <div className="space-y-3 bg-cream-100 rounded-lg p-8">
                <Body size="lg">
                  Body LG (18px) — The light caught the edge of the glass just
                  right, and for a moment the whole room felt different.
                </Body>
                <Body size="base">
                  Body Base (16px) — A quiet afternoon. The kind that asks
                  nothing of you except to be present in it.
                </Body>
                <Body size="sm" muted>
                  Body SM muted (16px floor) — Small text still meets the
                  minimum size rule. Muted variant using slate-muted.
                </Body>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Special styles</Label>
              <div className="space-y-4 bg-cream-100 rounded-lg p-8">
                <div>
                  <Label>Label component</Label>
                </div>
                <Companion>
                  Companion message style — The way the afternoon light falls
                  across this moment feels intentional somehow.
                </Companion>
              </div>
            </div>
          </div>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* 3. Component strip                                                   */}
        {/* ------------------------------------------------------------------ */}
        <Section title="3 · Components">
          <div className="space-y-8">
            {/* Buttons */}
            <div className="space-y-3">
              <Label>Button variants</Label>
              <div className="flex flex-wrap gap-3 items-center bg-cream-100 rounded-lg p-8">
                <Button variant="default">Default (sage)</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <Label>Input &amp; Textarea</Label>
              <div className="space-y-4 bg-cream-100 rounded-lg p-8 max-w-sm">
                <Input placeholder="Text input — type here" />
                <Textarea placeholder="Textarea — share your thoughts…" rows={3} />
              </div>
            </div>

            {/* Avatar */}
            <div className="space-y-3">
              <Label>Avatar</Label>
              <div className="flex gap-4 items-center bg-cream-100 rounded-lg p-8">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="https://i.pravatar.cc/64" alt="Example user" />
                  <AvatarFallback>SR</AvatarFallback>
                </Avatar>
                <Avatar className="h-10 w-10">
                  <AvatarFallback>AB</AvatarFallback>
                </Avatar>
                <Avatar className="h-8 w-8">
                  <AvatarFallback>CD</AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Card */}
            <div className="space-y-3">
              <Label>Card</Label>
              <div className="bg-cream-100 rounded-lg p-8">
                <Card className="max-w-sm">
                  <CardHeader>
                    <CardTitle>
                      <Heading as="h3" size="sm">
                        Card title
                      </Heading>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Body muted>
                      This is the card body — minimum p-6 padding, content
                      breathes.
                    </Body>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Skeleton */}
            <div className="space-y-3">
              <Label>Skeleton loading states</Label>
              <div className="space-y-3 bg-cream-100 rounded-lg p-8 max-w-sm">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </Section>

        {/* ------------------------------------------------------------------ */}
        {/* 4. Spacing reference                                                 */}
        {/* ------------------------------------------------------------------ */}
        <Section title="4 · Spacing Rules">
          <div className="space-y-6">
            <Body muted>
              Bible §6: minimum p-6 on cards, p-8 on screens. Content
              breathes — never pack elements tightly.
            </Body>

            <div className="space-y-4">
              {[
                { label: "p-6 — minimum card padding (24px)", cls: "p-6" },
                { label: "p-8 — minimum screen padding (32px)", cls: "p-8" },
                { label: "p-12 — generous section padding (48px)", cls: "p-12" },
              ].map(({ label, cls }) => (
                <div key={cls} className="space-y-2">
                  <Label>{label}</Label>
                  <div className="bg-cream-200 rounded-lg inline-block">
                    <div className={`${cls} bg-sage-100 rounded`}>
                      <Body size="sm">Content sits here</Body>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </main>
    </div>
  );
}
