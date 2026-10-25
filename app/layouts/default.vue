<template>
  <div class="flex min-h-screen flex-col">
    <a
      href="#main"
      class="absolute -top-15 left-4 z-30 rounded-md bg-marigold px-3.5 py-2.5 font-bold text-on-marigold focus:top-3"
    >Skip to content</a>
    <SiteHeader />
    <main id="main" class="flex-1 pb-12">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
