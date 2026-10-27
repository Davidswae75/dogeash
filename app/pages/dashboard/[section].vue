<script setup lang="ts">
// Dashboard sections that aren't built yet: say what will live here
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const section = dashboardSections[String(route.params.section)]
if (!section) throw createError({ statusCode: 404, statusMessage: 'No dashboard section with that name' })

useSeoMeta({ title: `${section.title} · Store dashboard · Dogeash`, robots: 'noindex' })
</script>

<template>
  <ComingNext v-if="section" :title="section.title" :text="section.text" :plan="section.plan" :back="{ to: '/dashboard', label: 'Back to overview' }" />
</template>
