<template>
  <div class="flex flex-col overflow-hidden rounded-lg border border-line bg-surface" aria-hidden="true">
    <div class="h-[34px] bg-night" />
    <Skeleton class="aspect-4/3 rounded-none" />
    <div class="flex flex-col gap-3 px-[18px] pt-4 pb-[18px]">
      <Skeleton class="h-6 w-1/2" />
      <Skeleton class="h-2" />
      <Skeleton class="h-9" />
    </div>
  </div>
</template>
