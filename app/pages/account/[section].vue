<script setup lang="ts">
// Account sections that aren't built yet: say what will live here
const route = useRoute()
const section = accountSections[String(route.params.section)]
if (!section) throw createError({ statusCode: 404, statusMessage: 'No account section with that name' })

useSeoMeta({ title: `${section.title} · My Dogeash` })
</script>

<template>
  <ComingNext v-if="section" :title="section.title" :text="section.text" :plan="section.plan" :back="{ to: '/account', label: 'Back to overview' }" />
</template>
