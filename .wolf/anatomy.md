# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-10-31T16:19:00.838Z
> Files: 637 tracked | Anatomy hits: 0 | Misses: 0

> Project structure index. Auto-maintained by OpenWolf hooks and daemon.
> Run `openwolf scan` to generate, or wait for the first Claude Code session.
> Status: Pending initial scan

## ./

- `.gitignore` — Git ignore rules (~52 tok)
- `CLAUDE.md` — OpenWolf (~99 tok)
- `components.json` (~126 tok)
- `nuxt.config.ts` — https://nuxt.com/docs/api/configuration/nuxt-config (~505 tok)
- `package.json` — Node.js package manifest (~356 tok)
- `PLAN.md` — Dogeash project plan (~3364 tok)
- `README.md` — Project documentation (~206 tok)
- `tsconfig.json` — TypeScript configuration (~92 tok)

## app/

- `app.vue` — Vue component (~26 tok)
- `error.vue` — Vue: setup (~806 tok)

## app/assets/css/

- `main.css` — Styles: 13 rules, 56 vars, 1 media queries, 5 animations, 1 layers (~1365 tok)
- `toast.css` — Styles: 26 rules, 7 vars (~1366 tok)
- `tokens.css` — Styles: 1 rules, 89 vars, 1 media queries (~736 tok)

## app/components/

- `AccountGateDialog.vue` — Vue: setup (~655 tok)
- `AppIcon.vue` — Vue: setup, TS, 3 props (~2222 tok)
- `AppLogo.vue` — Vue: setup, TS, 1 props (~160 tok)
- `AppToast.vue` — Vue component (~67 tok)
- `AuthCodeStep.vue` — Vue: setup (~740 tok)
- `AuthPanel.vue` — Vue: setup (~379 tok)
- `BigStats.vue` — Vue: setup, TS (~184 tok)
- `BookingDialog.vue` — Offer "At my home" as well as the other party's premises (~1786 tok)
- `BrandCover.vue` — Vue component (~322 tok)
- `CareBookingDialog.vue` — Vue: setup (~188 tok)
- `CareProviderCard.vue` — Vue: setup (~504 tok)
- `CheckboxField.vue` — Vue: setup (~294 tok)
- `ComingNext.vue` — Vue: setup (~330 tok)
- `ContactStoreDialog.vue` — Vue: setup (~1039 tok)
- `DashboardNav.vue` — Vue: setup (~1090 tok)
- `EmptyState.vue` — Vue: setup, TS, 2 props, emits (~240 tok)
- `FactRow.vue` — Vue: setup, TS (~184 tok)
- `FieldInput.vue` — Vue: setup (~744 tok)
- `Fields.vue` — Vue: setup (~721 tok)
- `FilterChips.vue` — Vue: setup, TS (~232 tok)
- `GuardDog3D.client.vue` — Vue: setup, TS, 1 props (~3241 tok)
- `HelpPanel.vue` — Vue: setup, TS, 3 props (~189 tok)
- `HowItWorks.vue` — Vue: setup, TS (~341 tok)
- `K9Card.vue` — Vue: setup (~822 tok)
- `K9CardSkeleton.vue` — Vue component (~107 tok)
- `K9FileTab.vue` — Vue: setup, TS, 4 props (~205 tok)
- `KennelSticker.vue` — Vue: setup, TS, 1 props (~173 tok)
- `KennelVisitDialog.vue` — Vue: setup (~427 tok)
- `KennelWatch.vue` — Vue: setup (~315 tok)
- `LegalDocument.vue` — Vue: setup (~664 tok)
- `MarketRow.vue` — Vue: setup (~655 tok)
- `OwnListingActions.vue` — Vue: setup (~521 tok)
- `OwnListingBanner.vue` — Vue: setup (~276 tok)
- `PatrolMap.vue` — Vue: setup, TS, 1 props (~325 tok)
- `PromiseStrip.vue` — Vue: setup, TS (~145 tok)
- `PropertyPicker.vue` — Vue: setup, TS, emits (~316 tok)
- `ProtectionLevelDetail.vue` — Vue: setup (~1152 tok)
- `ProtectionLevels.vue` — Vue: setup, TS (~319 tok)
- `ProtectionScale.vue` — Vue: setup, TS, 2 props (~219 tok)
- `SearchBar.vue` — Vue: setup, TS, 1 props, emits (~278 tok)
- `SellerCard.vue` — Vue: setup, TS, 2 props (~454 tok)
- `ShortlistButton.vue` — Vue: setup (~518 tok)
- `SiteFooter.vue` — Vue: setup, TS (~400 tok)
- `SiteFooterMinimal.vue` — Vue: setup (~302 tok)
- `SiteHeader.vue` — Vue: setup (~1923 tok)
- `StatusDot.vue` — Vue: setup, TS, 1 props (~98 tok)
- `StoreAvatar.vue` — Vue: setup (~131 tok)
- `StoreBanner.vue` — Vue: setup (~659 tok)
- `StoreCard.vue` — Vue: setup (~461 tok)
- `StoreListItem.vue` — Vue: setup (~1575 tok)
- `StoreTile.vue` — Vue: setup (~1953 tok)
- `ThemeToggle.vue` — Vue: setup, TS, 1 props (~533 tok)
- `ToastContent.vue` — Vue: setup (~849 tok)
- `TourBeacon.vue` — Vue component (~33 tok)
- `TourHint.vue` — Vue: setup, TS, 3 props, emits (~372 tok)
- `VerifiedStamp.vue` — Vue: setup, TS, 1 props (~150 tok)

## app/components/account/

- `AccountAvatar.vue` — Vue: setup (~262 tok)
- `AccountCareChip.vue` — Vue: setup (~150 tok)
- `AccountDogCard.vue` — Vue: setup (~579 tok)
- `AccountDogCare.vue` — Vue: setup (~554 tok)
- `AccountDogHeader.vue` — Vue: setup (~788 tok)
- `AccountDogHealth.vue` — Vue: setup (~395 tok)
- `AccountDogPortrait.vue` — Vue: setup (~386 tok)
- `AccountDogTraining.vue` — Vue: setup (~314 tok)
- `AccountHeading.vue` — Vue: setup (~221 tok)
- `AccountHomeProfile.vue` — Vue: setup (~286 tok)
- `AccountMenu.vue` — Vue: setup (~908 tok)
- `AccountMyDogs.vue` — Vue: setup (~400 tok)
- `AccountNav.vue` — Vue: setup (~886 tok)
- `AccountNotifications.vue` — Vue: setup (~989 tok)
- `AccountReadiness.vue` — Vue: setup (~387 tok)
- `AccountStoreCard.vue` — Vue: setup (~392 tok)
- `AccountStorePill.vue` — Vue: setup (~288 tok)

## app/components/auth/

- `AuthHeading.vue` — Vue: setup (~207 tok)
- `AuthLinkCards.vue` — Vue: setup (~360 tok)
- `AuthPanel.vue` — Vue: setup (~447 tok)
- `AuthPasswordStrength.vue` — Vue: setup (~246 tok)
- `AuthPasswordToggle.vue` — Vue: setup (~158 tok)

## app/components/dashboard/

- `DashboardAgenda.vue` — Vue: setup (~678 tok)
- `DashboardAttention.vue` — Vue: setup (~571 tok)
- `DashboardDogs.vue` — Vue: setup (~1172 tok)
- `DashboardGreeting.vue` — Vue: setup (~448 tok)
- `DashboardStats.vue` — Vue: setup (~576 tok)
- `DashboardStoreHealth.vue` — Vue: setup (~867 tok)
- `InboxDetail.vue` — Vue: setup (~1198 tok)
- `InboxList.vue` — Vue: setup (~1022 tok)
- `InboxReply.vue` — Vue: setup (~559 tok)

## app/components/gear/

- `GearCard.vue` — Vue: setup (~642 tok)
- `GearCartLine.vue` — Vue: setup (~686 tok)
- `GearIcon.vue` — Vue: setup (~317 tok)

## app/components/guide/

- `CostBars.vue` — Vue: setup, TS (~586 tok)
- `ImageSlot.vue` — Vue: setup, TS, 2 props (~638 tok)
- `ReadinessCheck.vue` — Vue: setup, TS (~595 tok)
- `SecurityLayers.vue` — Vue: setup, TS (~697 tok)

## app/components/home/

- `HomeComingUp.vue` — Vue: setup (~614 tok)
- `HomeGlance.vue` — Vue: setup (~731 tok)
- `HomeGuest.vue` — Vue: setup (~893 tok)
- `HomeHero.vue` — Vue: setup (~521 tok)
- `HomeHeroFrame.vue` — Vue: setup (~299 tok)
- `HomeIntroCard.vue` — Vue: setup (~454 tok)
- `HomePanel.vue` — Vue: setup (~283 tok)
- `HomeShortlistChanges.vue` — Vue: setup (~698 tok)
- `HomeSignedIn.vue` — Vue: setup (~750 tok)
- `HomeWelcome.vue` — Vue: setup (~610 tok)

## app/components/shortlist/

- `ShortlistCompareBar.vue` — Vue: setup (~467 tok)
- `ShortlistItem.vue` — Vue: setup (~824 tok)
- `ShortlistStoreGroup.vue` — Vue: setup (~638 tok)

## app/components/ui/accordion/

- `Accordion.vue` — Vue: setup, TS, emits (~127 tok)
- `AccordionContent.vue` — Vue: setup, TS (~192 tok)
- `AccordionItem.vue` — Vue: setup, TS (~185 tok)
- `AccordionTrigger.vue` — Vue: setup, TS (~331 tok)
- `index.ts` (~74 tok)

## app/components/ui/alert-dialog/

- `AlertDialog.vue` — Vue: setup, TS, emits (~126 tok)
- `AlertDialogAction.vue` — Vue: setup, TS (~161 tok)
- `AlertDialogCancel.vue` — Vue: setup, TS (~180 tok)
- `AlertDialogContent.vue` — Vue: setup, TS, emits (~415 tok)
- `AlertDialogDescription.vue` — Vue: setup, TS (~171 tok)
- `AlertDialogFooter.vue` — Vue: setup, TS, 1 props (~106 tok)
- `AlertDialogHeader.vue` — Vue: setup, TS, 1 props (~93 tok)
- `AlertDialogTitle.vue` — Vue: setup, TS (~159 tok)
- `AlertDialogTrigger.vue` — Vue: setup, TS (~86 tok)
- `index.ts` (~183 tok)

## app/components/ui/alert/

- `Alert.vue` — Vue: setup, TS, 2 props (~118 tok)
- `AlertDescription.vue` — Vue: setup, TS, 1 props (~98 tok)
- `AlertTitle.vue` — Vue: setup, TS, 1 props (~95 tok)
- `index.ts` — Exports alertVariants, AlertVariants (~260 tok)

## app/components/ui/aspect-ratio/

- `AspectRatio.vue` — Vue: setup, TS (~89 tok)
- `index.ts` (~17 tok)

## app/components/ui/attachment/

- `Attachment.vue` — Vue: setup, TS (~202 tok)
- `AttachmentAction.vue` — Vue: setup, TS (~158 tok)
- `AttachmentActions.vue` — Vue: setup, TS, 1 props (~153 tok)
- `AttachmentContent.vue` — Vue: setup, TS, 1 props (~115 tok)
- `AttachmentDescription.vue` — Vue: setup, TS, 1 props (~124 tok)
- `AttachmentGroup.vue` — Vue: setup, TS, 1 props (~138 tok)
- `AttachmentMedia.vue` — Vue: setup, TS, 2 props (~135 tok)
- `AttachmentTitle.vue` — Vue: setup, TS, 1 props (~124 tok)
- `AttachmentTrigger.vue` — Vue: setup, TS (~137 tok)
- `index.ts` — Exports attachmentVariants, AttachmentVariants, attachmentMediaVariants, AttachmentMediaVariants (~846 tok)

## app/components/ui/avatar/

- `Avatar.vue` — Vue: setup, TS, 1 props (~107 tok)
- `AvatarFallback.vue` — Vue: setup, TS (~167 tok)
- `AvatarImage.vue` — Vue: setup, TS (~87 tok)
- `index.ts` (~50 tok)

## app/components/ui/badge/

- `Badge.vue` — Vue: setup, TS (~176 tok)
- `index.ts` — Exports badgeVariants, BadgeVariants (~248 tok)

## app/components/ui/breadcrumb/

- `Breadcrumb.vue` — Vue: TS, 1 props (~76 tok)
- `BreadcrumbEllipsis.vue` — Vue: TS, 1 props (~140 tok)
- `BreadcrumbItem.vue` — Vue: TS, 1 props (~88 tok)
- `BreadcrumbLink.vue` — Vue: TS (~138 tok)
- `BreadcrumbList.vue` — Vue: TS, 1 props (~103 tok)
- `BreadcrumbPage.vue` — Vue: TS, 1 props (~106 tok)
- `BreadcrumbSeparator.vue` — Vue: TS, 1 props (~118 tok)
- `index.ts` (~133 tok)

## app/components/ui/bubble/

- `Bubble.vue` — Vue component (~202 tok)
- `BubbleContent.vue` — Vue component (~233 tok)
- `BubbleGroup.vue` — Vue: setup, TS (~143 tok)
- `BubbleReactions.vue` — Vue component (~215 tok)
- `index.ts` — Exports bubbleVariants, BubbleVariants, bubbleReactionsVariants, BubbleReactionsVariants (~931 tok)

## app/components/ui/button-group/

- `ButtonGroup.vue` — Vue: setup, TS, 2 props (~146 tok)
- `ButtonGroupSeparator.vue` — Vue: setup, TS (~188 tok)
- `ButtonGroupText.vue` — Vue: setup, TS (~209 tok)
- `index.ts` — Exports buttonGroupVariants, ButtonGroupVariants (~328 tok)

## app/components/ui/button/

- `Button.vue` — Vue: setup, TS (~195 tok)
- `index.ts` — Exports buttonVariants, ButtonVariants (~495 tok)

## app/components/ui/calendar/

- `Calendar.vue` — Vue: TS, emits (~1717 tok)
- `CalendarCell.vue` — Vue: TS (~206 tok)
- `CalendarCellTrigger.vue` — Vue: TS (~415 tok)
- `CalendarGrid.vue` — Vue: TS (~174 tok)
- `CalendarGridBody.vue` — Vue: TS (~86 tok)
- `CalendarGridHead.vue` — Vue: TS (~107 tok)
- `CalendarGridRow.vue` — Vue: TS (~171 tok)
- `CalendarHeadCell.vue` — Vue: TS (~190 tok)
- `CalendarHeader.vue` — Vue: TS (~184 tok)
- `CalendarHeading.vue` — Vue: TS, 1 props (~216 tok)
- `CalendarNextButton.vue` — Vue: TS (~244 tok)
- `CalendarPrevButton.vue` — Vue: TS (~243 tok)
- `index.ts` — Exports LayoutTypes (~254 tok)

## app/components/ui/card/

- `Card.vue` — Vue: setup, TS, 1 props (~109 tok)
- `CardAction.vue` — Vue: setup, TS, 1 props (~96 tok)
- `CardContent.vue` — Vue: setup, TS, 1 props (~81 tok)
- `CardDescription.vue` — Vue: setup, TS, 1 props (~87 tok)
- `CardFooter.vue` — Vue: setup, TS, 1 props (~90 tok)
- `CardHeader.vue` — Vue: setup, TS, 1 props (~120 tok)
- `CardTitle.vue` — Vue: setup, TS, 1 props (~86 tok)
- `index.ts` (~114 tok)

## app/components/ui/carousel/

- `Carousel.vue` — Vue: setup, TS, emits (~351 tok)
- `CarouselContent.vue` — Vue: setup, TS (~172 tok)
- `CarouselItem.vue` — Vue: setup, TS (~141 tok)
- `CarouselNext.vue` — Vue: setup, TS (~280 tok)
- `CarouselPrevious.vue` — Vue: setup, TS (~280 tok)
- `index.ts` (~123 tok)
- `interface.ts` — Exports UnwrapRefCarouselApi, CarouselProps, CarouselEmits, WithClassAsProps (~209 tok)
- `useCarousel.ts` — scrollPrev: scrollNext, onSelect, useCarousel (~439 tok)

## app/components/ui/chart/

- `ChartContainer.vue` — Vue: setup, TS, 4 props (~589 tok)
- `ChartLegendContent.vue` — Vue: setup, TS, 5 props (~372 tok)
- `ChartStyle.vue` — Vue: setup, TS, 1 props (~234 tok)
- `ChartTooltipContent.vue` — Vue: setup, TS, 12 props (~937 tok)
- `index.ts` — Exports THEMES, ChartConfig (~265 tok)
- `utils.ts` — Simple cache using a Map to store serialized object keys (~374 tok)

## app/components/ui/checkbox/

- `Checkbox.vue` — Vue: setup, TS, emits (~385 tok)
- `index.ts` (~16 tok)

## app/components/ui/code-block/

- `CodeBlock.vue` — Vue: setup, TS, 3 props (~155 tok)
- `CodeBlockActions.vue` — Vue: setup, TS, 1 props (~293 tok)
- `CodeBlockContent.vue` — Vue: setup, TS, 4 props (~661 tok)
- `CodeBlockCopyButton.vue` — Vue: setup, TS (~318 tok)
- `CodeBlockFooter.vue` — Vue: setup, TS, 1 props (~121 tok)
- `CodeBlockHeader.vue` — Vue: setup, TS, 1 props (~150 tok)
- `CodeBlockLine.vue` — Vue: setup, TS, 2 props (~324 tok)
- `CodeBlockTitle.vue` — Vue: setup, TS, 1 props (~157 tok)
- `CodeBlockToken.vue` — Vue: setup, TS, 1 props (~73 tok)
- `highlighter.ts` — Exports HighlightedToken, loadHighlighter, Highlighter, highlightCode (~1032 tok)
- `index.ts` — Exports codeBlockVariants, CodeBlockVariants, codeBlockLineVariants, CodeBlockLineVariants (~742 tok)
- `useHighlightedCode.ts` — Exports useHighlightedCode (~643 tok)

## app/components/ui/collapsible/

- `Collapsible.vue` — Vue: setup, TS, emits (~134 tok)
- `CollapsibleContent.vue` — Vue: setup, TS (~89 tok)
- `CollapsibleTrigger.vue` — Vue: setup, TS (~89 tok)
- `index.ts` (~59 tok)

## app/components/ui/combobox/

- `Combobox.vue` — Vue: setup, TS, emits (~128 tok)
- `ComboboxAnchor.vue` — Vue: setup, TS (~169 tok)
- `ComboboxEmpty.vue` — Vue: setup, TS (~154 tok)
- `ComboboxGroup.vue` — Vue: setup, TS (~204 tok)
- `ComboboxInput.vue` — Vue: setup, TS, emits (~311 tok)
- `ComboboxItem.vue` — Vue: setup, TS, emits (~285 tok)
- `ComboboxItemIndicator.vue` — Vue: setup, TS (~180 tok)
- `ComboboxList.vue` — Vue: setup, TS, emits (~377 tok)
- `ComboboxSeparator.vue` — Vue: setup, TS (~160 tok)
- `ComboboxTrigger.vue` — Vue: setup, TS (~172 tok)
- `ComboboxViewport.vue` — Vue: setup, TS (~185 tok)
- `index.ts` (~217 tok)

## app/components/ui/command/

- `Command.vue` — The count of all visible items. (~637 tok)
- `CommandDialog.vue` — Vue: setup, TS, emits (~260 tok)
- `CommandEmpty.vue` — Vue: setup, TS (~204 tok)
- `CommandGroup.vue` — Vue: setup, TS (~354 tok)
- `CommandInput.vue` — Vue: setup, TS (~304 tok)
- `CommandItem.vue` — Vue: setup, TS, emits (~638 tok)
- `CommandList.vue` — Vue: setup, TS (~193 tok)
- `CommandSeparator.vue` — Vue: setup, TS (~149 tok)
- `CommandShortcut.vue` — Vue: setup, TS, 1 props (~95 tok)
- `index.ts` (~291 tok)

## app/components/ui/context-menu/

- `ContextMenu.vue` — Vue: setup, TS, emits (~123 tok)
- `ContextMenuCheckboxItem.vue` — Vue: setup, TS, emits (~383 tok)
- `ContextMenuContent.vue` — Vue: setup, TS, emits (~379 tok)
- `ContextMenuGroup.vue` — Vue: setup, TS (~86 tok)
- `ContextMenuItem.vue` — Vue: setup, TS, emits (~417 tok)
- `ContextMenuLabel.vue` — Vue: setup, TS (~186 tok)
- `ContextMenuPortal.vue` — Vue: setup, TS (~87 tok)
- `ContextMenuRadioGroup.vue` — Vue: setup, TS, emits (~139 tok)
- `ContextMenuRadioItem.vue` — Vue: setup, TS, emits (~381 tok)
- `ContextMenuSeparator.vue` — Vue: setup, TS (~157 tok)
- `ContextMenuShortcut.vue` — Vue: setup, TS, 1 props (~97 tok)
- `ContextMenuSub.vue` — Vue: setup, TS, emits (~124 tok)
- `ContextMenuSubContent.vue` — Vue: setup, TS, emits (~348 tok)
- `ContextMenuSubTrigger.vue` — Vue: setup, TS (~305 tok)
- `ContextMenuTrigger.vue` — Vue: setup, TS (~108 tok)
- `index.ts` (~293 tok)

## app/components/ui/dialog/

- `Dialog.vue` — Vue: setup, TS, emits (~124 tok)
- `DialogClose.vue` — Vue: setup, TS (~78 tok)
- `DialogContent.vue` — Vue: setup, TS, emits (~524 tok)
- `DialogDescription.vue` — Vue: setup, TS (~182 tok)
- `DialogFooter.vue` — Vue: setup, TS, 2 props (~172 tok)
- `DialogHeader.vue` — Vue: setup, TS, 1 props (~92 tok)
- `DialogOverlay.vue` — Vue: setup, TS (~188 tok)
- `DialogScrollContent.vue` — Vue: setup, TS, emits (~500 tok)
- `DialogTitle.vue` — Vue: setup, TS (~173 tok)
- `DialogTrigger.vue` — Vue: setup, TS (~81 tok)
- `index.ts` (~179 tok)

## app/components/ui/drawer/

- `Drawer.vue` — Vue: TS, emits (~118 tok)
- `DrawerClose.vue` — Vue: TS (~78 tok)
- `DrawerContent.vue` — Vue: TS, emits (~728 tok)
- `DrawerDescription.vue` — Vue: TS (~162 tok)
- `DrawerFooter.vue` — Vue: TS, 1 props (~88 tok)
- `DrawerHeader.vue` — Vue: TS, 1 props (~87 tok)
- `DrawerOverlay.vue` — Vue: TS (~183 tok)
- `DrawerTitle.vue` — Vue: TS (~152 tok)
- `DrawerTrigger.vue` — Vue: TS (~81 tok)
- `index.ts` (~157 tok)

## app/components/ui/dropdown-menu/

- `DropdownMenu.vue` — Vue: setup, TS, emits (~137 tok)
- `DropdownMenuCheckboxItem.vue` — Vue: setup, TS, emits (~386 tok)
- `DropdownMenuContent.vue` — Vue: setup, TS, emits (~403 tok)
- `DropdownMenuGroup.vue` — Vue: setup, TS (~87 tok)
- `DropdownMenuItem.vue` — Vue: setup, TS (~388 tok)
- `DropdownMenuLabel.vue` — Vue: setup, TS (~205 tok)
- `DropdownMenuRadioGroup.vue` — Vue: setup, TS, emits (~141 tok)
- `DropdownMenuRadioItem.vue` — Vue: setup, TS, emits (~384 tok)
- `DropdownMenuSeparator.vue` — Vue: setup, TS (~159 tok)
- `DropdownMenuShortcut.vue` — Vue: setup, TS, 1 props (~97 tok)
- `DropdownMenuSub.vue` — Vue: setup, TS, emits (~133 tok)
- `DropdownMenuSubContent.vue` — Vue: setup, TS, emits (~354 tok)
- `DropdownMenuSubTrigger.vue` — Vue: setup, TS (~395 tok)
- `DropdownMenuTrigger.vue` — Vue: setup, TS (~110 tok)
- `index.ts` (~314 tok)

## app/components/ui/empty/

- `Empty.vue` — Vue: setup, TS, 1 props (~116 tok)
- `EmptyContent.vue` — Vue: setup, TS, 1 props (~106 tok)
- `EmptyDescription.vue` — Vue: setup, TS, 1 props (~111 tok)
- `EmptyHeader.vue` — Vue: setup, TS, 1 props (~99 tok)
- `EmptyMedia.vue` — Vue: setup, TS, 2 props (~128 tok)
- `EmptyTitle.vue` — Vue: setup, TS, 1 props (~88 tok)
- `index.ts` — Exports emptyMediaVariants, EmptyMediaVariants (~275 tok)

## app/components/ui/field/

- `Field.vue` — Vue: setup, TS, 2 props (~136 tok)
- `FieldContent.vue` — Vue: setup, TS, 1 props (~101 tok)
- `FieldDescription.vue` — Vue: setup, TS, 1 props (~155 tok)
- `FieldError.vue` — Vue: setup, TS (~370 tok)
- `FieldGroup.vue` — Vue: setup, TS, 1 props (~120 tok)
- `FieldLabel.vue` — Vue: setup, TS, 1 props (~207 tok)
- `FieldLegend.vue` — Vue: setup, TS, 2 props (~127 tok)
- `FieldSeparator.vue` — Vue: setup, TS, 1 props (~192 tok)
- `FieldSet.vue` — Vue: setup, TS, 1 props (~115 tok)
- `FieldTitle.vue` — Vue: setup, TS, 1 props (~113 tok)
- `index.ts` — Exports fieldVariants, FieldVariants (~486 tok)

## app/components/ui/form/

- `FormControl.vue` — Vue: TS (~114 tok)
- `FormDescription.vue` — Vue: TS, 1 props (~119 tok)
- `FormItem.vue` — Vue: TS, 1 props (~129 tok)
- `FormLabel.vue` — Vue: TS (~158 tok)
- `FormMessage.vue` — Vue: TS, 1 props (~144 tok)
- `index.ts` (~125 tok)
- `injectionKeys.ts` — Exports FORM_ITEM_INJECTION_KEY (~40 tok)
- `useFormField.ts` — Exports useFormField (~235 tok)

## app/components/ui/hover-card/

- `HoverCard.vue` — Vue: setup, TS, emits (~130 tok)
- `HoverCardContent.vue` — Vue: setup, TS (~349 tok)
- `HoverCardTrigger.vue` — Vue: setup, TS (~86 tok)
- `index.ts` (~56 tok)

## app/components/ui/input-group/

- `index.ts` — Exports inputGroupAddonVariants, InputGroupVariants, inputGroupButtonVariants, InputGroupButtonVariants (~594 tok)
- `InputGroup.vue` — Vue: setup, TS, 1 props (~367 tok)
- `InputGroupAddon.vue` — Vue: setup, TS, 2 props (~255 tok)
- `InputGroupButton.vue` — Vue: setup, TS (~205 tok)
- `InputGroupInput.vue` — Vue: setup, TS, 1 props (~119 tok)
- `InputGroupText.vue` — Vue: setup, TS, 1 props (~109 tok)
- `InputGroupTextarea.vue` — Vue: setup, TS, 1 props (~126 tok)

## app/components/ui/input-otp/

- `index.ts` (~71 tok)
- `InputOTP.vue` — Vue: setup, TS, emits (~224 tok)
- `InputOTPGroup.vue` — Vue: setup, TS, 1 props (~141 tok)
- `InputOTPSeparator.vue` — Vue: setup, TS, 1 props (~116 tok)
- `InputOTPSlot.vue` — Vue: setup, TS, 2 props (~387 tok)

## app/components/ui/input/

- `index.ts` (~14 tok)
- `Input.vue` — Vue: setup, TS, 3 props, emits (~338 tok)

## app/components/ui/item/

- `index.ts` — Exports itemVariants, itemMediaVariants, ItemVariants, ItemMediaVariants (~573 tok)
- `Item.vue` — Vue: setup, TS (~183 tok)
- `ItemActions.vue` — Vue: setup, TS, 1 props (~86 tok)
- `ItemContent.vue` — Vue: setup, TS, 1 props (~97 tok)
- `ItemDescription.vue` — Vue: setup, TS, 1 props (~127 tok)
- `ItemFooter.vue` — Vue: setup, TS, 1 props (~93 tok)
- `ItemGroup.vue` — Vue: setup, TS, 1 props (~91 tok)
- `ItemHeader.vue` — Vue: setup, TS, 1 props (~93 tok)
- `ItemMedia.vue` — Vue: setup, TS, 2 props (~128 tok)
- `ItemSeparator.vue` — Vue: setup, TS (~117 tok)
- `ItemTitle.vue` — Vue: setup, TS, 1 props (~96 tok)

## app/components/ui/kbd/

- `index.ts` (~28 tok)
- `Kbd.vue` — Vue: setup, TS, 1 props (~178 tok)
- `KbdGroup.vue` — Vue: setup, TS, 1 props (~87 tok)

## app/components/ui/label/

- `index.ts` (~14 tok)
- `Label.vue` — Vue: setup, TS (~201 tok)

## app/components/ui/marker/

- `index.ts` — Exports markerVariants, MarkerVariants (~249 tok)
- `Marker.vue` — Vue: setup, TS (~178 tok)
- `MarkerContent.vue` — Vue: setup, TS (~138 tok)
- `MarkerIcon.vue` — Vue: setup, TS (~106 tok)

## app/components/ui/menubar/

- `index.ts` (~278 tok)
- `Menubar.vue` — Vue: setup, TS, emits (~224 tok)
- `MenubarCheckboxItem.vue` — Vue: setup, TS, emits (~371 tok)
- `MenubarContent.vue` — Vue: setup, TS (~362 tok)
- `MenubarGroup.vue` — Vue: setup, TS (~79 tok)
- `MenubarItem.vue` — Vue: setup, TS, emits (~403 tok)
- `MenubarLabel.vue` — Vue: setup, TS (~169 tok)
- `MenubarMenu.vue` — Vue: setup, TS (~78 tok)
- `MenubarRadioGroup.vue` — Vue: setup, TS, emits (~130 tok)
- `MenubarRadioItem.vue` — Vue: setup, TS, emits (~369 tok)
- `MenubarSeparator.vue` — Vue: setup, TS (~170 tok)
- `MenubarShortcut.vue` — Vue: setup, TS, 1 props (~95 tok)
- `MenubarSub.vue` — Vue: setup, TS, emits (~142 tok)
- `MenubarSubContent.vue` — Vue: setup, TS, emits (~374 tok)
- `MenubarSubTrigger.vue` — Vue: setup, TS (~279 tok)
- `MenubarTrigger.vue` — Vue: setup, TS (~232 tok)

## app/components/ui/message-scroller/

- `index.ts` (~249 tok)
- `MessageScroller.vue` — Vue: setup, TS, 1 props (~168 tok)
- `MessageScrollerButton.vue` — Vue: setup, TS, 5 props (~680 tok)
- `MessageScrollerContent.vue` — Vue: setup, TS, 2 props (~517 tok)
- `MessageScrollerItem.vue` — Vue: setup, TS, 3 props (~352 tok)
- `MessageScrollerProvider.vue` — Vue: setup, TS (~79 tok)
- `MessageScrollerViewport.vue` — Vue: setup, TS, 2 props (~561 tok)
- `useMessageScroller.ts` — Public types (~9053 tok)

## app/components/ui/message/

- `index.ts` (~105 tok)
- `Message.vue` — Vue component (~181 tok)
- `MessageAvatar.vue` — Vue component (~184 tok)
- `MessageContent.vue` — Vue component (~169 tok)
- `MessageFooter.vue` — Vue component (~186 tok)
- `MessageGroup.vue` — Vue component (~148 tok)
- `MessageHeader.vue` — Vue component (~175 tok)

## app/components/ui/native-select/

- `index.ts` (~61 tok)
- `NativeSelect.vue` — Vue: setup, TS, 2 props, emits (~475 tok)
- `NativeSelectOptGroup.vue` — Vue: setup, TS, 1 props (~91 tok)
- `NativeSelectOption.vue` — Vue: setup, TS, 1 props (~89 tok)

## app/components/ui/navigation-menu/

- `index.ts` — Exports navigationMenuTriggerStyle (~347 tok)
- `NavigationMenu.vue` — Vue: setup, TS, emits (~288 tok)
- `NavigationMenuContent.vue` — Vue: setup, TS, emits (~587 tok)
- `NavigationMenuIndicator.vue` — Vue: setup, TS (~255 tok)
- `NavigationMenuItem.vue` — Vue: setup, TS (~158 tok)
- `NavigationMenuLink.vue` — Vue: setup, TS, emits (~327 tok)
- `NavigationMenuList.vue` — Vue: setup, TS (~202 tok)
- `NavigationMenuTrigger.vue` — Vue: setup, TS (~255 tok)
- `NavigationMenuViewport.vue` — Vue: setup, TS (~309 tok)

## app/components/ui/number-field/

- `index.ts` (~102 tok)
- `NumberField.vue` — Vue: setup, TS, emits (~193 tok)
- `NumberFieldContent.vue` — Vue: setup, TS, 1 props (~102 tok)
- `NumberFieldDecrement.vue` — Vue: setup, TS (~214 tok)
- `NumberFieldIncrement.vue` — Vue: setup, TS (~214 tok)
- `NumberFieldInput.vue` — Vue: setup, TS, 1 props (~159 tok)

## app/components/ui/pagination/

- `index.ts` (~154 tok)
- `Pagination.vue` — Vue: setup, TS, emits (~209 tok)
- `PaginationContent.vue` — Vue: setup, TS (~170 tok)
- `PaginationEllipsis.vue` — Vue: setup, TS (~204 tok)
- `PaginationFirst.vue` — Vue: setup, TS (~273 tok)
- `PaginationItem.vue` — Vue: setup, TS (~242 tok)
- `PaginationLast.vue` — Vue: setup, TS (~271 tok)
- `PaginationNext.vue` — Vue: setup, TS (~271 tok)
- `PaginationPrevious.vue` — Vue: setup, TS (~273 tok)

## app/components/ui/pin-input/

- `index.ts` (~71 tok)
- `PinInput.vue` — Vue: setup, TS, emits (~234 tok)
- `PinInputGroup.vue` — Vue: setup, TS (~166 tok)
- `PinInputSeparator.vue` — Vue: setup, TS (~112 tok)
- `PinInputSlot.vue` — Vue: setup, TS (~271 tok)

## app/components/ui/popover/

- `index.ts` (~70 tok)
- `Popover.vue` — Vue: setup, TS, emits (~126 tok)
- `PopoverAnchor.vue` — Vue: setup, TS (~81 tok)
- `PopoverContent.vue` — Vue: setup, TS, emits (~396 tok)
- `PopoverTrigger.vue` — Vue: setup, TS (~82 tok)

## app/components/ui/progress/

- `index.ts` (~16 tok)
- `Progress.vue` — Vue: setup, TS (~241 tok)

## app/components/ui/questionnaire/

- `index.ts` (~410 tok)
- `Questionnaire.vue` — Item shown first. Ignored when `item` is provided. (~2878 tok)
- `QuestionnaireActions.vue` — Vue: setup, TS (~161 tok)
- `QuestionnaireChoice.vue` — Controlled checked state. Use with `v-model:checked`. (~2052 tok)
- `QuestionnaireChoiceDescription.vue` — Vue: setup, TS, 1 props (~91 tok)
- `QuestionnaireChoices.vue` — Vue: setup, TS (~200 tok)
- `QuestionnaireDescription.vue` — Vue: setup, TS (~440 tok)
- `QuestionnaireError.vue` — Vue: setup, TS (~318 tok)
- `QuestionnaireInput.vue` — Fills the answer on mount and after a native form reset. (~1402 tok)
- `QuestionnaireItem.vue` — Excludes the item from the questionnaire without unmounting it. (~3599 tok)
- `QuestionnaireNext.vue` — Vue: setup, TS, emits (~585 tok)
- `QuestionnairePrevious.vue` — Vue: setup, TS, emits (~542 tok)
- `QuestionnaireProgress.vue` — Vue: setup, TS (~400 tok)
- `QuestionnaireSkip.vue` — Vue: setup, TS, emits (~539 tok)
- `QuestionnaireSubmit.vue` — Vue: setup, TS (~483 tok)
- `QuestionnaireTitle.vue` — Vue: setup, TS (~395 tok)
- `useQuestionnaire.ts` — Bumped after a controlled answer interaction so every control re-syncs. (~2303 tok)

## app/components/ui/radio-group/

- `index.ts` (~35 tok)
- `RadioGroup.vue` — Vue: setup, TS, emits (~202 tok)
- `RadioGroupItem.vue` — Vue: setup, TS (~371 tok)

## app/components/ui/range-calendar/

- `index.ts` (~264 tok)
- `RangeCalendar.vue` — Vue: TS, emits (~603 tok)
- `RangeCalendarCell.vue` — Vue: TS (~257 tok)
- `RangeCalendarCellTrigger.vue` — Vue: TS (~502 tok)
- `RangeCalendarGrid.vue` — Vue: TS (~183 tok)
- `RangeCalendarGridBody.vue` — Vue: TS (~94 tok)
- `RangeCalendarGridHead.vue` — Vue: TS (~94 tok)
- `RangeCalendarGridRow.vue` — Vue: TS (~179 tok)
- `RangeCalendarHeadCell.vue` — Vue: TS (~197 tok)
- `RangeCalendarHeader.vue` — Vue: TS (~191 tok)
- `RangeCalendarHeading.vue` — Vue: TS, 1 props (~224 tok)
- `RangeCalendarNextButton.vue` — Vue: TS (~254 tok)
- `RangeCalendarPrevButton.vue` — Vue: TS (~253 tok)

## app/components/ui/resizable/

- `index.ts` (~60 tok)
- `ResizableHandle.vue` — Vue: setup, TS, emits (~433 tok)
- `ResizablePanel.vue` — Vue: setup, TS, emits (~154 tok)
- `ResizablePanelGroup.vue` — Vue: setup, TS, emits (~215 tok)

## app/components/ui/scroll-area/

- `index.ts` (~32 tok)
- `ScrollArea.vue` — Vue: setup, TS (~252 tok)
- `ScrollBar.vue` — Vue: setup, TS (~272 tok)

## app/components/ui/select/

- `index.ts` (~200 tok)
- `Select.vue` — Vue: setup, TS, emits (~124 tok)
- `SelectContent.vue` — Vue: setup, TS, emits (~515 tok)
- `SelectGroup.vue` — Vue: setup, TS (~78 tok)
- `SelectItem.vue` — Vue: setup, TS (~383 tok)
- `SelectItemText.vue` — Vue: setup, TS (~83 tok)
- `SelectLabel.vue` — Vue: setup, TS (~122 tok)
- `SelectScrollDownButton.vue` — Vue: setup, TS (~220 tok)
- `SelectScrollUpButton.vue` — Vue: setup, TS (~216 tok)
- `SelectSeparator.vue` — Vue: setup, TS (~154 tok)
- `SelectTrigger.vue` — Vue: setup, TS (~452 tok)
- `SelectValue.vue` — Vue: setup, TS (~78 tok)

## app/components/ui/separator/

- `index.ts` (~16 tok)
- `Separator.vue` — Vue: setup, TS (~205 tok)

## app/components/ui/sheet/

- `index.ts` (~135 tok)
- `Sheet.vue` — Vue: setup, TS, emits (~123 tok)
- `SheetClose.vue` — Vue: setup, TS (~77 tok)
- `SheetContent.vue` — Vue: setup, TS, emits (~618 tok)
- `SheetDescription.vue` — Vue: setup, TS (~162 tok)
- `SheetFooter.vue` — Vue: setup, TS, 1 props (~89 tok)
- `SheetHeader.vue` — Vue: setup, TS, 1 props (~86 tok)
- `SheetOverlay.vue` — Vue: setup, TS (~188 tok)
- `SheetTitle.vue` — Vue: setup, TS (~152 tok)
- `SheetTrigger.vue` — Vue: setup, TS (~80 tok)

## app/components/ui/sidebar/

- `index.ts` — Exports SidebarProps, sidebarMenuButtonVariants, SidebarMenuButtonVariants (~978 tok)
- `Sidebar.vue` — Vue: setup, TS (~918 tok)
- `SidebarContent.vue` — Vue: setup, TS, 1 props (~113 tok)
- `SidebarFooter.vue` — Vue: setup, TS, 1 props (~93 tok)
- `SidebarGroup.vue` — Vue: setup, TS, 1 props (~98 tok)
- `SidebarGroupAction.vue` — Vue: setup, TS (~237 tok)
- `SidebarGroupContent.vue` — Vue: setup, TS, 1 props (~95 tok)
- `SidebarGroupLabel.vue` — Vue: setup, TS (~242 tok)
- `SidebarHeader.vue` — Vue: setup, TS, 1 props (~93 tok)
- `SidebarInput.vue` — Vue: setup, TS, 1 props (~115 tok)
- `SidebarInset.vue` — Vue: setup, TS, 1 props (~157 tok)
- `SidebarMenu.vue` — Vue: setup, TS, 1 props (~95 tok)
- `SidebarMenuAction.vue` — Vue: setup, TS (~364 tok)
- `SidebarMenuBadge.vue` — Vue: setup, TS, 1 props (~226 tok)
- `SidebarMenuButton.vue` — Vue: setup, TS (~350 tok)
- `SidebarMenuButtonChild.vue` — Vue: setup, TS (~254 tok)
- `SidebarMenuItem.vue` — Vue: setup, TS, 1 props (~95 tok)
- `SidebarMenuSkeleton.vue` — Vue: setup, TS, 2 props (~222 tok)
- `SidebarMenuSub.vue` — Vue: setup, TS, 1 props (~131 tok)
- `SidebarMenuSubButton.vue` — Vue: setup, TS (~360 tok)
- `SidebarMenuSubItem.vue` — Vue: setup, TS, 1 props (~98 tok)
- `SidebarProvider.vue` — Vue: setup, TS, 3 props, emits (~635 tok)
- `SidebarRail.vue` — Vue: setup, TS, 1 props (~339 tok)
- `SidebarSeparator.vue` — Vue: setup, TS, 1 props (~114 tok)
- `SidebarTrigger.vue` — Vue: setup, TS, 1 props (~166 tok)
- `utils.ts` — Exports SIDEBAR_COOKIE_NAME, SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_WIDTH, SIDEBAR_WIDTH_MOBILE + 2 more (~191 tok)

## app/components/ui/skeleton/

- `index.ts` (~16 tok)
- `Skeleton.vue` — Vue: setup, TS (~121 tok)

## app/components/ui/slider/

- `index.ts` (~14 tok)
- `Slider.vue` — Vue: setup, TS, emits (~474 tok)

## app/components/ui/sonner/

- `index.ts` (~15 tok)
- `Sonner.vue` — Vue: TS (~308 tok)

## app/components/ui/spinner/

- `index.ts` (~15 tok)
- `Spinner.vue` — Vue: setup, TS, 1 props (~96 tok)

## app/components/ui/stepper/

- `index.ts` (~128 tok)
- `Stepper.vue` — Vue: TS, emits (~194 tok)
- `StepperDescription.vue` — Vue: TS (~178 tok)
- `StepperIndicator.vue` — Vue: TS (~289 tok)
- `StepperItem.vue` — Vue: TS (~182 tok)
- `StepperSeparator.vue` — Vue: TS (~201 tok)
- `StepperTitle.vue` — Vue: TS (~163 tok)
- `StepperTrigger.vue` — Vue: TS (~174 tok)

## app/components/ui/switch/

- `index.ts` (~14 tok)
- `Switch.vue` — Vue: setup, TS, emits (~396 tok)

## app/components/ui/table/

- `index.ts` (~144 tok)
- `Table.vue` — Vue: setup, TS, 1 props (~107 tok)
- `TableBody.vue` — Vue: setup, TS, 1 props (~87 tok)
- `TableCaption.vue` — Vue: setup, TS, 1 props (~91 tok)
- `TableCell.vue` — Vue: setup, TS, 1 props (~115 tok)
- `TableEmpty.vue` — Vue: setup, TS, 2 props (~201 tok)
- `TableFooter.vue` — Vue: setup, TS, 1 props (~95 tok)
- `TableHead.vue` — Vue: setup, TS, 1 props (~117 tok)
- `TableHeader.vue` — Vue: setup, TS, 1 props (~85 tok)
- `TableRow.vue` — Vue: setup, TS, 1 props (~98 tok)

## app/components/ui/tabs/

- `index.ts` (~62 tok)
- `Tabs.vue` — Vue: setup, TS, emits (~191 tok)
- `TabsContent.vue` — Vue: setup, TS (~150 tok)
- `TabsList.vue` — Vue: setup, TS (~171 tok)
- `TabsTrigger.vue` — Vue: setup, TS (~347 tok)

## app/components/ui/tags-input/

- `index.ts` (~94 tok)
- `TagsInput.vue` — Vue: setup, TS, emits (~283 tok)
- `TagsInputInput.vue` — Vue: setup, TS (~166 tok)
- `TagsInputItem.vue` — Vue: setup, TS (~199 tok)
- `TagsInputItemDelete.vue` — Vue: setup, TS (~191 tok)
- `TagsInputItemText.vue` — Vue: setup, TS (~173 tok)

## app/components/ui/textarea/

- `index.ts` (~16 tok)
- `Textarea.vue` — Vue: setup, TS, 3 props, emits (~284 tok)

## app/components/ui/toggle-group/

- `index.ts` (~36 tok)
- `ToggleGroup.vue` — Vue: setup, TS, emits (~396 tok)
- `ToggleGroupItem.vue` — Vue: setup, TS (~436 tok)

## app/components/ui/toggle/

- `index.ts` — Exports toggleVariants, ToggleVariants (~532 tok)
- `Toggle.vue` — Vue: setup, TS, emits (~257 tok)

## app/components/ui/tooltip/

- `index.ts` (~71 tok)
- `Tooltip.vue` — Vue: setup, TS, emits (~126 tok)
- `TooltipContent.vue` — Vue: setup, TS, emits (~369 tok)
- `TooltipProvider.vue` — Vue: setup, TS (~84 tok)
- `TooltipTrigger.vue` — Vue: setup, TS (~82 tok)

## app/components/ui/trace/

- `index.ts` (~148 tok)
- `Trace.vue` — Vue: setup, TS, 1 props (~199 tok)
- `TraceCollapsible.vue` — Vue: setup, TS, emits (~219 tok)
- `TraceCollapsibleContent.vue` — Vue: setup, TS (~252 tok)
- `TraceCollapsibleTrigger.vue` — Vue: setup, TS (~305 tok)

## app/composables/

- `useAccountGate.ts` — Unique per action and target, e.g. `visit:STR-001` (~550 tok)
- `useAccountList.ts` — Lists of dog file numbers kept in this browser per person: one for the guest, one per account. (~636 tok)
- `useAuthPanel.ts` — Lets an auth page swap its side panel while it's open (sign-up shows a store panel for "Open a store (~180 tok)
- `useFirstVisit.ts` — Whether this browser has dismissed a one-time message, e.g. the "New to guard dogs?" intro (~107 tok)
- `useNotify.ts` — Every toast in the app goes through here, so the same action always looks and reads the same. (~1090 tok)
- `useRecentlyViewed.ts` — Dogs this browser has opened, newest first. Kept on the device until accounts exist. (~147 tok)
- `useSession.ts` — Who is signed in. A sample session in a cookie (so the server renders the right header) (~335 tok)
- `useShortlist.ts` — The buyer's shortlist: dogs they're considering, and up to three picked to compare. (~562 tok)
- `useStoreContext.ts` — The store the dashboard is showing, and what the signed-in person may do there. (~178 tok)
- `useStoreInbox.ts` — The store inbox as one shared list: what this person's role may see, unread counts for the bell (~397 tok)

## app/layouts/

- `auth.vue` — Vue: setup (~288 tok)
- `dashboard.vue` — Vue: setup (~842 tok)
- `default.vue` — Vue: setup (~169 tok)

## app/middleware/

- `signed-in.ts` — Pages that need an account: send visitors to sign in, then back to where they were going (~80 tok)
- `store-member.ts` — Store dashboard pages: only people who work at a store. Visitors sign in first; (~115 tok)

## app/pages/

- `account.vue` — Vue: setup (~119 tok)
- `forgot-password.vue` — Vue: setup (~1003 tok)
- `index.vue` — Vue: setup (~979 tok)
- `protection-levels.vue` — Vue: setup (~732 tok)
- `sell.vue` — Vue: setup (~1528 tok)
- `sign-in.vue` — Vue: setup (~1217 tok)
- `sign-up.vue` — Vue: setup (~1370 tok)

## app/pages/account/

- `[section].vue` — Vue: setup (~140 tok)
- `index.vue` — Vue: setup (~194 tok)

## app/pages/account/dogs/

- `[id].vue` — Vue: setup (~282 tok)
- `index.vue` — Vue: setup (~396 tok)

## app/pages/dashboard/

- `[section].vue` — Vue: setup (~394 tok)
- `inbox.vue` — Vue: setup (~783 tok)
- `index.vue` — Vue: setup (~228 tok)

## app/pages/shortlist/

- `compare.vue` — Vue: setup (~1000 tok)
- `index.vue` — Vue: setup (~658 tok)

## app/pages/stores/

- `[slug].vue` — Vue: setup (~5610 tok)
- `index.vue` — Vue: setup (~3412 tok)

## app/plugins/

- `centerTab.ts` — v-center-tab on a row of tabs that scrolls sideways: the clicked tab slides to the row's centre, (~477 tok)
- `toast.client.ts` — Toasts confirm what a buyer just did. Use them through useNotify(), not useToast() directly, (~206 tok)

## app/types/

- `page-meta.d.ts` — default layout: 'full' shows the full footer (Home); everything else gets quick links (~139 tok)

## app/utils/

- `account.ts` — The signed-in buyer, until accounts are connected: one sample account, plus what the (~678 tok)
- `auth.ts` — Sign-in and sign-up validation, shared by the forms and (later) the API (~359 tok)
- `authFields.ts` — Field definitions shared by sign-in and sign-up, for <Fields> (~338 tok)
- `care.ts` — Care network: vets, trainers, groomers, kennel builders, equipment suppliers and boarding. (~1087 tok)
- `compare.ts` — Numeric key for picking the best dog on this row; lower wins unless `higherIsBetter` (~439 tok)
- `dashboard.ts` — Store dashboard: navigation and example figures until accounts and the API exist. (~1396 tok)
- `gear.ts` — Gear shop: normal products with sizes and quantities. Dogs never go in the cart. (~1305 tok)
- `gen.ts` — Read and write values on nested objects by dotted path ("owner.name") (~181 tok)
- `inbox.ts` — How the buyer hears about replies, besides Dogeash itself (~1864 tok)
- `legal.ts` — Terms of use and privacy policy, in plain words. DRAFTS: both must be reviewed by a Nigerian lawyer (~1282 tok)
- `market.ts` — The marketplace rows on Home: which dogs and stores each one shows (~545 tok)
- `myDogs.ts` — Dogs a buyer owns after handover: a living record of health, training and care. (~928 tok)
- `sell.ts` — The Sell with us page: why kennels list on Dogeash, how verification works, what to have ready, and (~915 tok)
- `signUpIntents.ts` — "What brings you here?" on sign-up. Each answer changes the heading, the fields, the side panel (~1043 tok)
- `storeRoles.ts` — People who work at a store, and what each role may do in the store dashboard. (~442 tok)
- `stores.ts` — A store is a kennel that sells guard dogs on Dogeash. Dogs link to it by storeId; (~3985 tok)

## scripts/

- `render-kennel-watch.mjs` — Renders the kennel watch for the sign-in and sign-up pages: a K9 stands guard beside its kennel, (~4330 tok)
