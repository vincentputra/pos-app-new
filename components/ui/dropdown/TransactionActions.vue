<template>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon">
        <MoreHorizontal class="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-48 bg-white">
      <DropdownMenuItem class="hover:bg-gray-50 cursor-pointer" @click="emit('edit', transaction)">
        <Pencil class="w-4 h-4 mr-2" />
        Edit
      </DropdownMenuItem>
      <DropdownMenuSeparator class="bg-gray-100" />
      <DropdownMenuItem 
        class="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer" 
        @click="emit('delete', transaction)"
      >
        <Trash class="w-4 h-4 mr-2" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash } from 'lucide-vue-next'
import type { Transaction } from '@/composables/useTransactions'

const props = defineProps<{
  transaction: Transaction
}>()

const emit = defineEmits<{
  edit: [transaction: Transaction]
  delete: [transaction: Transaction]
}>()
</script> 