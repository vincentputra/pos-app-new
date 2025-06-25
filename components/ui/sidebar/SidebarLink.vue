<script setup lang="ts">
import { useSidebar } from './utils';

defineProps<{
  to: string;
  active?: boolean;
}>();

const { isMobile, setOpenMobile } = useSidebar();

const handleClick = () => {
  if (isMobile.value) {
    setOpenMobile(false);
  }
};
</script>

<template>
  <NuxtLink v-bind="$attrs" :to="to" @click="handleClick">
    <slot />
  </NuxtLink>
</template>
