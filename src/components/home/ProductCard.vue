<script setup>
import { t } from '@/i18n'
import { ref } from 'vue'
import { image } from '@/utils/assets'
import DesignIcon from './DesignIcon.vue'

defineProps({ product: { type: Object, required: true } })
defineEmits(['details'])
const saved = ref(false)
</script>

<template>
  <article class="product-card">
    <div class="product-visual">
      <button
        class="product-photo"
        type="button"
        :aria-label="product.name"
        @click="$emit('details', product)"
      >
        <img
          :src="image(product.photo)"
          :alt="product.name"
          width="302"
          height="236"
          loading="lazy"
        />
      </button>
      <span v-if="product.tag" class="product-tag">{{ product.tag }}</span>
      <button
        class="favorite"
        :class="{ saved }"
        type="button"
        :aria-label="`${t(saved ? '取消收藏' : '收藏')} ${product.name}`"
        :aria-pressed="saved"
        @click="saved = !saved"
      >
        <DesignIcon name="c5c03.svg" />
      </button>
    </div>
    <div class="product-info">
      <p>{{ product.description }}</p>
      <h3>{{ product.name }}</h3>
      <button type="button" @click="$emit('details', product)">{{ t('查看商品详情 ↗') }}</button>
    </div>
  </article>
</template>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}
.product-visual {
  position: relative;
  height: 236px;
  overflow: hidden;
  border-radius: 16px;
}
.product-photo,
.product-photo img {
  display: block;
  width: 100%;
  height: 100%;
}
.product-photo img {
  object-fit: cover;
  transition: transform 200ms ease;
}
.product-photo:hover img {
  transform: scale(1.025);
}
.product-tag {
  position: absolute;
  top: 14px;
  left: 14px;
  padding: 6px 10px;
  border-radius: 100px;
  background: white;
  font-size: 10px;
  pointer-events: none;
}
.favorite {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: white;
}
.favorite.saved {
  background: #ffd4bd;
  box-shadow: 0 0 0 2px var(--color-primary);
}
.product-info {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 7px;
}
.product-info p {
  color: var(--color-text-secondary);
  font-size: 11px;
  line-height: 13px;
}
h3 {
  font-size: 16px;
  line-height: 19px;
  font-weight: 700;
}
.product-info button {
  color: var(--color-primary);
  font-size: 12px;
  line-height: 14px;
}
@media (max-width: 600px) {
  .product-visual {
    height: 200px;
  }
}
</style>
