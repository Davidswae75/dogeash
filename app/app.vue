<template>
  <NuxtRouteAnnouncer />
  <!-- Page changes: a thin marigold bar along the top -->
  <NuxtLoadingIndicator color="var(--marigold)" :height="3" :throttle="150" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <!-- Waits with no other visible progress, such as signing out: useLoader().run() -->
  <AppLoader />
</template>
