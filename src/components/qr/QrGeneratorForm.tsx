"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { QrCode } from "@prisma/client";
import { Download, Save, Share2, Trash2, Layers, Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ColorPickerField } from "@/components/qr/ColorPickerField";
import { LogoUploader } from "@/components/qr/LogoUploader";
import { ViewfinderFrame } from "@/components/qr/ViewfinderFrame";
import { QrTypeSelector } from "@/components/qr/QrTypeSelector";
import { QrContentFields } from "@/components/qr/QrContentFields";
import { ErrorCorrectionSelector } from "@/components/qr/ErrorCorrectionSelector";
import { DotStyleSelector } from "@/components/qr/DotStyleSelector";
import { FinderStyleSelector } from "@/components/qr/FinderStyleSelector";
import { QrCanvas } from "@/components/qr/QrCanvas";
import { QrSvg } from "@/components/qr/QrSvg";
import { useQrDownload } from "@/hooks/use-qr-download";
import { createQrCode, updateQrCode, deleteQrCode } from "@/actions/qr-actions";
import {
  buildQrValue,
  defaultQrFieldValues,
  parseQrValue,
  qrFormSchema,
  qrTypeLabels,
  type QrFieldValues,
  type QrFormValues,
  type QrType,
} from "@/lib/qr-schema";

const styleFormSchema = qrFormSchema.omit({ type: true, data: true });
type StyleFormValues = z.infer<typeof styleFormSchema>;

const styleDefaultValues: StyleFormValues = {
  name: "",
  fgColor: "#000000",
  bgColor: "#FFFFFF",
  size: 512,
  level: "M",
  dotStyle: "SQUARE",
  finderFrameStyle: "SQUARE",
  finderMarkerStyle: "SQUARE",
  margin: 1,
  logoDataUrl: undefined,
  logoSize: 20,
};

type Tab = "content" | "style";

const fieldLabelClassName = "font-mono text-xs font-normal tracking-wide text-muted-foreground uppercase";
const accordionTriggerClassName = "px-2 font-mono text-xs tracking-wide uppercase";
const accordionContentClassName = "px-2 pt-3 pb-7";

// Clerk's post-sign-in redirect (NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL)
// can remount this component, wiping plain React state — sessionStorage survives
// that so the save-after-login retry still has the payload to work with.
const PENDING_SAVE_KEY = "qrframe:pending-save";

function readPendingSave(): QrFormValues | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PENDING_SAVE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as QrFormValues;
  } catch {
    return null;
  }
}

function writePendingSave(payload: QrFormValues) {
  sessionStorage.setItem(PENDING_SAVE_KEY, JSON.stringify(payload));
}

function clearPendingSave() {
  sessionStorage.removeItem(PENDING_SAVE_KEY);
}

type QrGeneratorFormProps = {
  mode?: "create" | "edit";
  qrCode?: QrCode;
};

export function QrGeneratorForm({ mode = "create", qrCode }: QrGeneratorFormProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const download = useQrDownload();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [activeTab, setActiveTab] = useState<Tab>("content");
  const [qrType, setQrType] = useState<QrType>(qrCode?.type ?? "URL");
  const [fields, setFields] = useState<QrFieldValues>(() =>
    qrCode ? parseQrValue(qrCode.type, qrCode.data) : defaultQrFieldValues,
  );

  const form = useForm<StyleFormValues>({
    resolver: zodResolver(styleFormSchema),
    defaultValues: qrCode
      ? {
          name: qrCode.name ?? "",
          fgColor: qrCode.fgColor,
          bgColor: qrCode.bgColor,
          size: qrCode.size,
          level: qrCode.level,
          dotStyle: qrCode.dotStyle,
          finderFrameStyle: qrCode.finderFrameStyle,
          finderMarkerStyle: qrCode.finderMarkerStyle,
          margin: qrCode.margin,
          logoDataUrl: qrCode.logoDataUrl ?? undefined,
          logoSize: qrCode.logoSize,
        }
      : styleDefaultValues,
  });

  const style = form.watch();
  const qrValue = useMemo(() => buildQrValue(qrType, fields), [qrType, fields]);
  const hasContent = qrValue.length > 0;

  function handleFieldChange(key: keyof QrFieldValues, value: string | boolean) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleDownloadPng() {
    download(canvasRef.current, style.name || "qr-code");
  }

  function handleDownloadSvg() {
    download(svgRef.current, style.name || "qr-code");
  }

  function handleDelete() {
    if (!qrCode) return;
    startDeleting(async () => {
      try {
        await deleteQrCode(qrCode.id);
        toast.success("QR code deleted");
        router.push("/saved");
      } catch {
        toast.error("Could not delete the QR code");
      }
    });
  }

  function saveQrCode(payload: QrFormValues) {
    startSaving(async () => {
      try {
        await createQrCode(payload);
        toast.success("QR code saved");
      } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
          writePendingSave(payload);
          openSignIn();
          return;
        }
        toast.error("Could not save the QR code");
      }
    });
  }

  function onSubmit(values: StyleFormValues) {
    const payload = qrFormSchema.parse({ ...values, type: qrType, data: qrValue });

    if (mode === "edit" && qrCode) {
      startSaving(async () => {
        try {
          await updateQrCode(qrCode.id, payload);
          toast.success("Changes saved");
          router.push("/saved");
        } catch {
          toast.error("Could not save changes");
        }
      });
      return;
    }

    if (!isSignedIn) {
      writePendingSave(payload);
      openSignIn();
      return;
    }
    saveQrCode(payload);
  }

  // Once the sign-in modal (opened from onSubmit above) succeeds, isSignedIn
  // flips to true and we finish the save the user originally asked for. This
  // also covers Clerk's post-sign-in redirect remounting the component, since
  // the pending payload lives in sessionStorage rather than component state.
  // Editing is only reachable from a protected route, so this retry path is
  // create-only.
  useEffect(() => {
    if (mode !== "create" || !isSignedIn) return;
    const pending = readPendingSave();
    if (!pending) return;
    clearPendingSave();
    saveQrCode(pending);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, mode]);

  const imageSettings = style.logoDataUrl
    ? {
        src: style.logoDataUrl,
        height: Math.round(style.size * (style.logoSize / 100)),
        width: Math.round(style.size * (style.logoSize / 100)),
        excavate: true,
      }
    : undefined;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Form {...form}>
        <form
          id="qr-generator-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="min-w-0 space-y-6"
        >
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={fieldLabelClassName}>Name (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="My QR code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex border-b border-border">
              {(
                [
                  { id: "content" as Tab, label: "Content", icon: Layers },
                  { id: "style" as Tab, label: "Style", icon: Settings2 },
                ] as const
              ).map(({ id, label, icon: Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={
                      "-mb-px flex flex-1 items-center justify-center gap-2 border-b-2 py-2.5 font-mono text-xs tracking-wide uppercase transition-colors " +
                      (active
                        ? "cursor-default border-primary text-primary"
                        : "cursor-pointer border-transparent text-muted-foreground hover:text-foreground")
                    }
                  >
                    <Icon className="size-3.5" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === "content" ? (
            <div className="space-y-4">
              <QrTypeSelector value={qrType} onChange={setQrType} />
              <QrContentFields type={qrType} fields={fields} onFieldChange={handleFieldChange} />
            </div>
          ) : (
            <Accordion type="single" collapsible defaultValue="color" className="-mt-1">
              <AccordionItem value="color">
                <AccordionTrigger className={accordionTriggerClassName}>
                  Color
                </AccordionTrigger>
                <AccordionContent className={accordionContentClassName}>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fgColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={fieldLabelClassName}>Foreground</FormLabel>
                          <FormControl>
                            <ColorPickerField value={field.value} onChange={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bgColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={fieldLabelClassName}>Background</FormLabel>
                          <FormControl>
                            <ColorPickerField value={field.value} onChange={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="style">
                <AccordionTrigger className={accordionTriggerClassName}>
                  Style
                </AccordionTrigger>
                <AccordionContent className={accordionContentClassName}>
                  <div className="space-y-5">
                    <FormField
                      control={form.control}
                      name="dotStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={fieldLabelClassName}>Dot style</FormLabel>
                          <FormControl>
                            <DotStyleSelector value={field.value} onChange={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="finderFrameStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={fieldLabelClassName}>Finder frame</FormLabel>
                          <FormControl>
                            <FinderStyleSelector value={field.value} onChange={field.onChange} filled={false} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="finderMarkerStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={fieldLabelClassName}>Finder marker</FormLabel>
                          <FormControl>
                            <FinderStyleSelector value={field.value} onChange={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="size">
                <AccordionTrigger className={accordionTriggerClassName}>
                  Size
                </AccordionTrigger>
                <AccordionContent className={accordionContentClassName}>
                  <div className="space-y-5">
                    <FormField
                      control={form.control}
                      name="size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={fieldLabelClassName}>Size — {field.value}px</FormLabel>
                          <FormControl>
                            <Slider
                              min={128}
                              max={1024}
                              step={32}
                              value={[field.value]}
                              onValueChange={([v]) => field.onChange(v)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="margin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={fieldLabelClassName}>Margin — {field.value} cells</FormLabel>
                          <FormControl>
                            <Slider
                              min={0}
                              max={10}
                              step={1}
                              value={[field.value]}
                              onValueChange={([v]) => field.onChange(v)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="logo">
                <AccordionTrigger className={accordionTriggerClassName}>
                  Logo
                </AccordionTrigger>
                <AccordionContent className={accordionContentClassName}>
                  <div className="space-y-5">
                    <FormField
                      control={form.control}
                      name="logoDataUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={fieldLabelClassName}>Logo (optional)</FormLabel>
                          <FormControl>
                            <LogoUploader value={field.value} onChange={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {style.logoDataUrl ? (
                      <FormField
                        control={form.control}
                        name="logoSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={fieldLabelClassName}>Logo size — {field.value}%</FormLabel>
                            <FormControl>
                              <Slider
                                min={10}
                                max={40}
                                step={1}
                                value={[field.value]}
                                onValueChange={([v]) => field.onChange(v)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : null}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="quality">
                <AccordionTrigger className={accordionTriggerClassName}>
                  Error correction
                </AccordionTrigger>
                <AccordionContent className={accordionContentClassName}>
                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ErrorCorrectionSelector value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </form>
      </Form>

      <div className="flex min-w-0 flex-col items-center gap-4 px-6 pt-5">
        <ViewfinderFrame active={hasContent} className="w-full">
          <Card className="sticky top-8 aspect-square w-full gap-0 bg-soft-gradient py-0 shadow-lg shadow-primary/10 ring-1 ring-primary/15">
            <CardContent className="flex h-full items-center justify-center p-5">
              {hasContent ? (
                <>
                  <QrCanvas
                    ref={canvasRef}
                    value={qrValue}
                    size={style.size}
                    fgColor={style.fgColor}
                    bgColor={style.bgColor}
                    level={style.level}
                    marginSize={style.margin}
                    dotStyle={style.dotStyle}
                    finderFrameStyle={style.finderFrameStyle}
                    finderMarkerStyle={style.finderMarkerStyle}
                    imageSettings={imageSettings}
                    style={{ width: `min(100%, ${style.size}px)`, height: "auto" }}
                  />
                  <QrSvg
                    ref={svgRef}
                    value={qrValue}
                    size={style.size}
                    fgColor={style.fgColor}
                    bgColor={style.bgColor}
                    level={style.level}
                    marginSize={style.margin}
                    dotStyle={style.dotStyle}
                    finderFrameStyle={style.finderFrameStyle}
                    finderMarkerStyle={style.finderMarkerStyle}
                    imageSettings={imageSettings}
                    className="hidden"
                  />
                </>
              ) : (
                <p className="max-w-40 text-center text-sm text-muted-foreground">
                  Enter some content to preview the QR code
                </p>
              )}
            </CardContent>
          </Card>
        </ViewfinderFrame>

        {hasContent ? (
          <>
            <div className="mt-4 grid w-full grid-cols-3 overflow-hidden rounded-md border border-border">
              {[
                { label: "Type", value: qrTypeLabels[qrType] },
                { label: "Size", value: `${style.size}px` },
                { label: "Correction", value: style.level },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-0.5 border-r border-border py-1.5 last:border-r-0"
                >
                  <span className="font-mono text-[0.6rem] tracking-wide text-muted-foreground uppercase">
                    {label}
                  </span>
                  <span className="font-mono text-sm font-medium text-primary">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex w-full flex-wrap justify-between gap-3">
              <div className="flex flex-wrap gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="outline" onClick={handleDownloadPng}>
                      <Download /> PNG
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download PNG</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button type="button" variant="outline" onClick={handleDownloadSvg}>
                      <Download /> SVG
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download SVG</TooltipContent>
                </Tooltip>
                {mode === "edit" && qrCode ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Share"
                        asChild
                      >
                        <Link href={`/code/${qrCode.id}`}>
                          <Share2 />
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Share</TooltipContent>
                  </Tooltip>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-1">
                <Button
                  type="submit"
                  form="qr-generator-form"
                  variant={isSaving ? "outline" : "default"}
                  disabled={isSaving}
                >
                  <Save className="size-4" /> {isSaving ? "Saving…" : "Save"}
                </Button>
                {mode === "edit" && qrCode ? (
                  <AlertDialog>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            aria-label="Delete"
                            disabled={isDeleting}
                            className="bg-destructive text-white hover:bg-destructive/90"
                          >
                            <Trash2 />
                          </Button>
                        </AlertDialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this QR code?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
