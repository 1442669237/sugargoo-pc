<script setup>
import { computed, onMounted, onBeforeUnmount, reactive, ref, toRefs } from 'vue'
import DesignIcon from '@/components/home/DesignIcon.vue'
import SectionHeading from '@/components/home/SectionHeading.vue'
import ProductCard from '@/components/home/ProductCard.vue'
import { image } from '@/utils/assets'
import { getHome, getShippingEstimate } from '@/api/home'
import LocaleSettings from '@/components/LocaleSettings.vue'
import { useSettingsStore } from '@/stores/settings'
import { t } from '@/i18n'

const settings = useSettingsStore()

const home = reactive({
  shortcuts: [],
  offers: [],
  categories: [],
  products: [],
  steps: [],
  assurances: [],
  routes: [],
  stories: [],
  questions: [],
  footerGroups: [],
})
const {
  shortcuts,
  offers,
  categories,
  products,
  steps,
  assurances,
  routes,
  stories,
  questions,
  footerGroups,
} = toRefs(home)
const loading = ref(true)
const loadError = ref('')
const controller = new AbortController()

async function loadHome() {
  loading.value = true
  loadError.value = ''
  try {
    const data = await getHome({ signal: controller.signal })
    Object.assign(home, data)
  } catch (error) {
    if (!controller.signal.aborted) loadError.value = error.message
  } finally {
    loading.value = false
  }
}
onMounted(loadHome)
onBeforeUnmount(() => controller.abort())
const estimating = ref(false)

const searchInput = ref(null)
const search = ref('')
const category = ref('all')
const visibleProducts = computed(() =>
  category.value === 'all'
    ? products.value
    : products.value.filter((product) => product.categoryCode === category.value),
)
const openQuestion = ref(0)
const destination = ref('')
const weight = ref('')
const goodsType = ref('')
const dialog = ref(null)
const dialogTitle = ref('')
const dialogText = ref('')
const selectedProduct = ref(null)
const shippingResult = ref(null)
const showingShipping = ref(false)
const shippingText = computed(() => {
  const result = shippingResult.value
  return result
    ? t('shipping.resultDescription', {
        ...result,
        price: settings.price(result.amount),
        days: result.estimatedDays,
      })
    : ''
})

function showMessage(title, text = t('common.demoNotice')) {
  showingShipping.value = false
  selectedProduct.value = null
  dialogTitle.value = title
  dialogText.value = text
  dialog.value.showModal()
}
function showProduct(product) {
  showMessage(
    product.name,
    t('products.demoDescription', {
      description: product.description,
    }),
  )
  selectedProduct.value = product
}
function focusSearch() {
  searchInput.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  searchInput.value?.focus({ preventScroll: true })
}
function submitSearch() {
  if (!search.value.trim()) {
    searchInput.value?.focus()
    return
  }
  showMessage(
    t('search.dialogTitle'),
    t('search.demoResult', {
      link: search.value.trim(),
    }),
  )
}
async function estimateShipping() {
  if (estimating.value) return
  const amount = Number(weight.value)
  if (!destination.value || !goodsType.value || !Number.isFinite(amount) || amount <= 0) {
    showMessage(t('shipping.validationTitle'), t('shipping.validationDescription'))
    return
  }
  estimating.value = true
  try {
    const result = await getShippingEstimate({
      destination: destination.value,
      goodsType: goodsType.value,
      weight: amount,
    })
    shippingResult.value = result
    showMessage(t('shipping.resultTitle'))
    showingShipping.value = true
  } catch (error) {
    showMessage(t('shipping.errorTitle'), error.response?.data?.message || error.message)
  } finally {
    estimating.value = false
  }
}
function navigate(label, target) {
  if (target === '#search') focusSearch()
  else if (target) document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' })
  else showMessage(label)
}
</script>

<template>
  <div id="top" class="home-page">
    <header>
      <div class="announcement">
        <p>{{ t('home.announcement') }}</p>
        <a href="#process">{{ t('home.learnService') }}</a>
      </div>
      <div class="main-nav page-width">
        <a class="wordmark" href="#top" :aria-label="t('nav.homeLabel')">SUGARGOO</a>
        <nav :aria-label="t('nav.mainLabel')">
          <a
            v-for="(label, index) in [
              'nav.home',
              'nav.discover',
              'nav.shipping',
              'nav.guide',
              'nav.help',
            ]"
            :key="label"
            :href="['#top', '#products', '#shipping', '#process', '#help'][index]"
            :class="{ active: index === 0 }"
            >{{ t(label) }}</a
          >
        </nav>
        <div class="nav-tools">
          <LocaleSettings />
          <button
            type="button"
            :aria-label="t('nav.cart')"
            @click="showMessage(t('nav.cart'), t('cart.empty'))"
          >
            <DesignIcon name="28d44.svg" />
          </button>
          <button class="login" type="button" @click="showMessage(t('nav.login'))">
            {{ t('nav.login') }}
          </button>
          <button
            class="primary-button register"
            type="button"
            @click="showMessage(t('nav.register'))"
          >
            {{ t('nav.register') }} <DesignIcon name="22410.svg" />
          </button>
        </div>
      </div>
    </header>

    <main id="main-content" tabindex="-1" :aria-busy="loading">
      <div v-if="loading || loadError" class="data-status" role="status" aria-live="polite">
        <span v-if="loading">{{ t('home.loading') }}</span>
        <template v-else
          ><span>{{ t('home.loadFailed', { error: loadError }) }}</span
          ><button class="outline-button" type="button" @click="loadHome">
            {{ t('common.reload') }}
          </button></template
        >
      </div>
      <section class="hero page-width" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="hero-eyebrow eyebrow"><span></span>{{ t('hero.eyebrow') }}</p>
          <h1 id="hero-title">
            {{ t('hero.title') }}<br /><span>{{ t('hero.titleAccent') }}</span>
          </h1>
          <p class="hero-description">
            {{ t('hero.description') }}<br />{{ t('hero.descriptionBrand') }}
          </p>
          <div id="search" class="search-area">
            <form class="search-form" @submit.prevent="submitSearch">
              <label class="search-field"
                ><DesignIcon name="b438e.svg" /><input
                  ref="searchInput"
                  v-model="search"
                  type="text"
                  :aria-label="t('search.linkLabel')"
                  :placeholder="t('search.placeholder')"
              /></label>
              <button class="primary-button" type="submit">
                {{ t('search.submit') }} <DesignIcon name="22410.svg" />
              </button>
            </form>
            <div class="search-help">
              <p>{{ t('search.steps') }}</p>
              <button type="button" @click="showMessage(t('search.manualTitle'))">
                {{ t('search.manualAction') }}
              </button>
            </div>
          </div>
          <ul class="hero-benefits">
            <li
              v-for="benefit in [
                'hero.shoppingBenefit',
                'hero.inspectionBenefit',
                'hero.consolidationBenefit',
              ]"
              :key="benefit"
            >
              <DesignIcon name="f4ba0.svg" />{{ t(benefit) }}
            </li>
          </ul>
        </div>
        <div class="hero-visual">
          <img
            class="hero-photo"
            :src="image('2ef26.png')"
            :alt="t('hero.imageAlt')"
            width="554"
            height="460"
            fetchpriority="high"
          />
          <p class="photo-kicker">{{ t('hero.imageEyebrow') }}</p>
          <div class="photo-caption">
            <h2>{{ t('hero.captionTitle') }}</h2>
            <p>{{ t('hero.captionDescription') }}</p>
          </div>
        </div>
      </section>
      <div class="shortcuts page-width">
        <button
          v-for="shortcut in shortcuts"
          :key="shortcut.id"
          class="shortcut"
          type="button"
          @click="navigate(shortcut.title, shortcut.target)"
        >
          <DesignIcon :name="shortcut.icon" /><span class="shortcut-copy"
            ><strong>{{ shortcut.title }}</strong
            ><span>{{ shortcut.description }}</span></span
          ><DesignIcon name="b5867.svg" />
        </button>
      </div>

      <section id="offers" class="offers-section section white-section page-width">
        <SectionHeading
          :eyebrow="t('offers.eyebrow')"
          :title="t('offers.title')"
          :action="t('offers.viewAll')"
          @action="showMessage(t('offers.dialogTitle'))"
        />
        <div class="offers-grid">
          <article
            v-for="(offer, index) in offers"
            :key="offer.id"
            class="offer-card"
            :class="{ 'offer-green': index === 1 }"
          >
            <div class="offer-copy">
              <p class="offer-label">{{ offer.label }}</p>
              <h3>{{ offer.title }}</h3>
              <p class="offer-description">{{ offer.description }}</p>
              <button type="button" @click="showMessage(offer.label, t('offers.demoNotice'))">
                {{ offer.action }}
              </button>
            </div>
            <div class="offer-symbol"><DesignIcon :name="offer.icon" /></div>
          </article>
        </div>
        <article class="special-offer">
          <div class="special-copy">
            <p class="eyebrow">{{ t('offers.specialEyebrow') }}</p>
            <h3>{{ t('offers.specialTitle') }}</h3>
            <p>{{ t('offers.specialDescription') }}</p>
            <a class="primary-button" href="#products"
              >{{ t('offers.specialAction') }} <DesignIcon name="22410.svg"
            /></a>
          </div>
          <img
            :src="image('782ba.png')"
            :alt="t('offers.imageAlt')"
            width="560"
            height="236"
            loading="lazy"
          />
        </article>
        <p class="section-note">{{ t('offers.termsNotice') }}</p>
      </section>

      <section id="products" class="section products-section page-width">
        <SectionHeading
          :eyebrow="t('products.eyebrow')"
          :title="t('products.title')"
          :description="t('products.description')"
          :action="t('products.browse')"
          @action="showMessage(t('products.moreTitle'))"
        />
        <div class="category-tabs" role="group" :aria-label="t('products.categoriesLabel')">
          <button
            v-for="item in categories"
            :key="item.code"
            type="button"
            :class="{ selected: item.code === category }"
            :aria-pressed="item.code === category"
            @click="category = item.code"
          >
            {{ item.label }}
          </button>
        </div>
        <div v-if="visibleProducts.length" class="products-grid">
          <ProductCard
            v-for="product in visibleProducts"
            :key="product.id"
            :product="product"
            @details="showProduct"
          />
        </div>
        <p v-else class="empty-products">{{ t('products.empty') }}</p>
        <p class="section-note">
          {{ t('products.imageNotice') }}
        </p>
      </section>

      <section id="process" class="section process-section page-width">
        <SectionHeading
          :eyebrow="t('process.eyebrow')"
          :title="t('process.title')"
          :description="t('process.description')"
          :action="t('process.guide')"
          dark
          @action="navigate(t('nav.help'), '#help')"
        />
        <ol class="steps-grid">
          <li v-for="(step, index) in steps" :key="step.id" class="step">
            <div class="step-top">
              <span class="step-icon"><DesignIcon :name="step.icon" /></span
              ><span class="step-number">0{{ index + 1 }}</span>
            </div>
            <div class="step-divider"></div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.description }}</p>
          </li>
        </ol>
        <div class="assurances">
          <div v-for="[title, description] in assurances" :key="title">
            <h3>{{ title }}</h3>
            <p>{{ description }}</p>
          </div>
        </div>
      </section>

      <section id="shipping" class="section white-section shipping-section page-width">
        <SectionHeading
          :eyebrow="t('shipping.eyebrow')"
          :title="t('shipping.title')"
          :description="t('shipping.description')"
          :action="t('shipping.viewAll')"
          @action="showMessage(t('shipping.routesTitle'), t('shipping.routesNotice'))"
        />
        <form class="shipping-form" @submit.prevent="estimateShipping">
          <h3><DesignIcon name="6081d.svg" />{{ t('shipping.formTitle') }}</h3>
          <label class="shipping-field"
            ><span>{{ t('shipping.destinationLabel') }}</span
            ><select v-model="destination" :aria-label="t('shipping.destinationLabel')">
              <option disabled value="">{{ t('shipping.destinationPlaceholder') }}</option>
              <option value="US">{{ t('countries.US') }}</option>
              <option value="GB">{{ t('countries.GB') }}</option>
              <option value="CA">{{ t('countries.CA') }}</option>
              <option value="AU">{{ t('countries.AU') }}</option>
              <option value="JP">{{ t('countries.JP') }}</option>
            </select></label
          >
          <label class="shipping-field"
            ><span>{{ t('shipping.weightLabel') }}</span
            ><input
              v-model="weight"
              type="number"
              min="1"
              step="1"
              :aria-label="t('shipping.weightAriaLabel')"
              :placeholder="t('shipping.weightPlaceholder')"
          /></label>
          <label class="shipping-field"
            ><span>{{ t('shipping.goodsTypeLabel') }}</span
            ><select v-model="goodsType" :aria-label="t('shipping.goodsTypeLabel')">
              <option disabled value="">{{ t('shipping.goodsTypePlaceholder') }}</option>
              <option value="clothing">{{ t('goodsTypes.clothing') }}</option>
              <option value="shoes">{{ t('goodsTypes.shoes') }}</option>
              <option value="household">{{ t('goodsTypes.household') }}</option>
            </select></label
          >
          <button class="primary-button" type="submit" :disabled="estimating">
            {{ t(estimating ? 'shipping.searching' : 'shipping.search') }}
            <DesignIcon name="22410.svg" />
          </button>
        </form>
        <p v-if="shippingResult" class="shipping-result" role="status">{{ shippingText }}</p>
        <div class="routes-grid">
          <article v-for="route in routes" :key="route.id" class="route-card">
            <div class="route-top">
              <span class="route-icon" :class="route.tone"><DesignIcon :name="route.icon" /></span
              ><span>{{ route.label }}</span>
            </div>
            <h3>{{ route.title }}</h3>
            <p class="route-description">{{ route.description }}</p>
            <div class="route-meta">
              <p>{{ t('shipping.costNotice') }}</p>
              <p>{{ t('shipping.restrictionsNotice') }}</p>
            </div>
            <button type="button" @click="estimateShipping">{{ t('shipping.matchRoutes') }}</button>
          </article>
        </div>
        <p class="section-note">
          {{ t('shipping.availabilityNotice') }}
        </p>
      </section>

      <section id="stories" class="section stories-section page-width">
        <SectionHeading
          :eyebrow="t('stories.eyebrow')"
          :title="t('stories.title')"
          :description="t('stories.description')"
          :action="t('stories.action')"
          @action="showMessage(t('stories.dialogTitle'))"
        />
        <div class="stories-grid">
          <article v-for="story in stories" :key="story.id" class="story-card">
            <img
              :src="image(story.photo)"
              :alt="story.title"
              width="411"
              height="280"
              loading="lazy"
            />
            <div class="story-copy">
              <p>{{ story.category }}</p>
              <h3>{{ story.title }}</h3>
              <button
                type="button"
                :aria-label="t('common.viewTitle', { title: story.title })"
                @click="showMessage(story.title, t('stories.demoNotice'))"
              >
                <span>{{ t('stories.scenario') }}</span
                ><DesignIcon name="03c0d.svg" />
              </button>
            </div>
          </article>
        </div>
        <p class="section-note">
          {{ t('stories.imageNotice') }}
        </p>
      </section>

      <section id="help" class="help-section white-section page-width">
        <div class="help-copy">
          <p class="eyebrow">{{ t('help.eyebrow') }}</p>
          <h2>{{ t('help.title') }}<br />{{ t('help.titleAccent') }}</h2>
          <p class="help-description">
            {{ t('help.description') }}<br />{{ t('help.descriptionEnd') }}
          </p>
          <button
            class="outline-button"
            type="button"
            @click="showMessage(t('nav.help'), t('help.dialogDescription'))"
          >
            {{ t('help.action') }} <DesignIcon name="90ed9.svg" /></button
          ><button
            class="contact-link"
            type="button"
            @click="showMessage(t('help.supportTitle'), t('help.supportNotice'))"
          >
            <DesignIcon name="b5414.svg" />{{ t('help.contactAction') }}
          </button>
        </div>
        <div class="faq-list">
          <article v-for="(question, index) in questions" :key="question.id" class="faq-item">
            <h3>
              <button
                :id="`question-${index}`"
                type="button"
                :aria-expanded="openQuestion === index"
                :aria-controls="`answer-${index}`"
                @click="openQuestion = openQuestion === index ? null : index"
              >
                {{ question.title
                }}<DesignIcon :name="openQuestion === index ? 'a3782.svg' : '245bc.svg'" />
              </button>
            </h3>
            <p
              v-show="openQuestion === index"
              :id="`answer-${index}`"
              :aria-labelledby="`question-${index}`"
            >
              {{ question.answer }}
            </p>
          </article>
        </div>
      </section>
      <section class="search-cta page-width">
        <div>
          <h2>{{ t('search.ctaTitle') }}</h2>
          <p>{{ t('search.ctaDescription') }}</p>
        </div>
        <button class="primary-button" type="button" @click="focusSearch">
          {{ t('search.ctaAction') }} <DesignIcon name="22410.svg" />
        </button>
      </section>
    </main>

    <footer class="site-footer page-width">
      <div class="footer-main">
        <div class="footer-brand">
          <a class="footer-wordmark" href="#top">SUGARGOO</a>
          <p>{{ t('footer.brandTitle') }}<br />{{ t('footer.brandDescription') }}</p>
          <div class="social-links">
            <button
              v-for="social in [
                { name: 'Instagram', icon: '79755.svg' },
                { name: 'YouTube', icon: 'f446e.svg' },
                { name: t('footer.community'), icon: '5b431.svg' },
              ]"
              :key="social.name"
              type="button"
              :aria-label="social.name"
              @click="showMessage(social.name)"
            >
              <DesignIcon :name="social.icon" />
            </button>
          </div>
        </div>
        <div v-for="group in footerGroups" :key="group.id" class="footer-group">
          <h2>{{ group.title }}</h2>
          <button
            v-for="link in group.links"
            :key="link.id"
            type="button"
            @click="navigate(link.label, link.target)"
          >
            {{ link.label }}
          </button>
        </div>
      </div>
      <div class="footer-bottom">
        <p>{{ t('footer.copyright') }}</p>
        <div>
          <button
            v-for="label in ['footer.terms', 'footer.privacy', 'footer.restrictions']"
            :key="label"
            type="button"
            @click="showMessage(t(label))"
          >
            {{ t(label) }}</button
          ><LocaleSettings />
        </div>
      </div>
    </footer>

    <dialog ref="dialog" class="mock-dialog" @click="$event.target === dialog && dialog.close()">
      <div class="dialog-content">
        <button
          class="dialog-close"
          type="button"
          :aria-label="t('common.closeDialog')"
          @click="dialog.close()"
        >
          ×</button
        ><img
          v-if="selectedProduct"
          class="dialog-product"
          :src="image(selectedProduct.photo)"
          :alt="selectedProduct.name"
        />
        <h2>{{ dialogTitle }}</h2>
        <p>{{ showingShipping ? shippingText : dialogText }}</p>
        <button class="primary-button" type="button" @click="dialog.close()">
          {{ t('common.confirm') }}
        </button>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
.shipping-result {
  margin-block: 16px;
  line-height: 1.6;
}

.data-status {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 20px;
  background: #fff0e6;
}
button:disabled {
  cursor: wait;
  opacity: 0.65;
}
.home-page {
  background: var(--color-background);
}
.page-width {
  padding-inline: max(32px, calc((100% - 1280px) / 2));
}
.announcement {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  height: 34px;
  background: #252823;
  color: white;
  font-size: 12px;
}
.announcement a {
  color: #ffa779;
}
.main-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88px;
  background: white;
}
.wordmark {
  color: var(--color-primary);
  font:
    400 30px/1.2 Inter,
    sans-serif;
}
.main-nav nav {
  display: flex;
  align-items: center;
  gap: 30px;
  font-size: 14px;
  font-weight: 500;
}
.main-nav nav .active {
  color: var(--color-primary);
  font-weight: 700;
}
.nav-tools {
  display: flex;
  align-items: center;
  gap: 20px;
}
.login {
  font-size: 14px;
}
.hero {
  display: flex;
  align-items: center;
  gap: 42px;
  padding-block: 54px 48px;
}
.hero-copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  align-items: start;
  gap: 24px;
}
.hero-eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
}
.hero-eyebrow span {
  width: 20px;
  height: 3px;
  background: var(--color-primary);
}
h1 {
  font-size: 56px;
  font-weight: 700;
  line-height: 1.25;
}
h1 span {
  color: var(--color-primary);
}
.hero-description {
  color: var(--color-text-secondary);
  font-size: 16px;
  line-height: 1.8;
}
.search-area {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 12px;
  padding-top: 8px;
}
.search-form {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 72px;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: white;
}
.search-field {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  gap: 12px;
  padding-left: 12px;
}
.search-field input {
  width: 100%;
  min-width: 0;
  outline: none;
  font-size: 15px;
}
.search-field input::placeholder {
  color: #aaaca4;
  opacity: 1;
}
.search-form:focus-within {
  outline: 2px solid #ef662d;
  outline-offset: 2px;
}
.search-help {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: var(--color-text-secondary);
  font-size: 12px;
}
.search-help button {
  color: var(--color-text);
}
.hero-benefits {
  display: flex;
  align-items: center;
  gap: 24px;
  padding-top: 6px;
  font-size: 13px;
}
.hero-benefits li {
  display: flex;
  align-items: center;
  gap: 7px;
}
.hero-visual {
  position: relative;
  flex: 0 0 43.28125%;
  height: 460px;
  overflow: hidden;
  border-radius: 24px;
}
.hero-photo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.photo-kicker {
  position: absolute;
  top: 22px;
  left: 22px;
  padding: 9px 14px;
  border-radius: 100px;
  background: white;
  font:
    400 11px/1.2 Inter,
    sans-serif;
}
.photo-caption {
  position: absolute;
  bottom: 22px;
  left: 22px;
  display: flex;
  width: 260px;
  flex-direction: column;
  gap: 5px;
  padding: 16px;
  border-radius: 16px;
  background: white;
}
.photo-caption h2 {
  font-size: 16px;
  font-weight: 700;
}
.photo-caption p {
  color: var(--color-text-secondary);
  font-size: 12px;
}
.shortcuts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  padding-bottom: 34px;
}
.shortcut {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  border-radius: 16px;
  background: white;
  text-align: left;
}
.shortcut-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;
}
.shortcut-copy strong {
  font-size: 15px;
  font-weight: 700;
}
.shortcut-copy > span {
  color: var(--color-text-secondary);
  font-size: 12px;
}
.section {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding-block: 64px;
}
.white-section {
  background: white;
}
.offers-section {
  padding-top: 54px;
}
.offers-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}
.offer-card {
  display: flex;
  align-items: center;
  gap: 26px;
  padding: 28px;
  border-radius: 16px;
  background: #fff0e6;
}
.offer-green {
  background: #e7ecdd;
}
.offer-copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  align-items: start;
  gap: 12px;
}
.offer-label {
  color: var(--color-primary);
  font-size: 12px;
  font-weight: 700;
}
.offer-copy h3 {
  font-size: 24px;
  font-weight: 700;
}
.offer-description {
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}
.offer-copy button {
  font-size: 14px;
  font-weight: 700;
}
.offer-symbol {
  display: grid;
  flex: none;
  place-items: center;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: white;
}
.special-offer {
  display: flex;
  gap: 40px;
  height: 236px;
  overflow: hidden;
  border-radius: 16px;
  background: #252823;
  color: white;
}
.special-copy {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  align-items: start;
  gap: 13px;
  padding: 30px 0 30px 36px;
}
.special-copy .eyebrow {
  color: #f8ad83;
  font-size: 11px;
  font-weight: 400;
}
.special-copy h3 {
  font-size: 30px;
  font-weight: 700;
}
.special-copy > p:not(.eyebrow) {
  color: #c8cbc2;
  font-size: 14px;
}
.special-offer > img {
  display: block;
  width: 43.75%;
  height: 236px;
  object-fit: cover;
}
.section-note {
  color: var(--color-text-secondary);
  font-size: 11px;
}
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.category-tabs button {
  padding: 11px 24px;
  border-radius: 100px;
  background: white;
  font-size: 13px;
  font-weight: 500;
}
.category-tabs .selected {
  background: #242521;
  color: white;
}
.products-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 28px 24px;
}
.empty-products {
  display: grid;
  min-height: 310px;
  place-items: center;
  color: var(--color-text-secondary);
}
.process-section {
  gap: 40px;
  background: #252823;
  color: white;
}
.steps-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
}
.step {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-right: 18px;
}
.step-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.step-icon {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 16px;
  background: #373c33;
}
.step-number {
  color: #737b69;
  font:
    400 36px/1.2 Inter,
    sans-serif;
}
.step-divider {
  height: 1px;
  background: #484d43;
}
.step h3 {
  font-size: 20px;
  font-weight: 700;
}
.step > p {
  color: #c8cbc2;
  font-size: 14px;
  line-height: 1.8;
}
.assurances {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 28px;
  padding-top: 26px;
  border-top: 1px solid #484d43;
}
.assurances > div {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.assurances h3 {
  font-size: 16px;
  font-weight: 700;
}
.assurances p {
  color: #c8cbc2;
  font-size: 12px;
}
.shipping-form {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px;
  border-radius: 16px;
  background: var(--color-background);
}
.shipping-form h3 {
  display: flex;
  flex: 0 0 212px;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 700;
}
.shipping-field {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
  padding: 10px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: white;
}
.shipping-field > span {
  color: var(--color-text-secondary);
  font-size: 10px;
}
.shipping-field input,
.shipping-field select {
  width: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--color-text);
  font-size: 13px;
  appearance: none;
}
.shipping-field:focus-within {
  outline: 2px solid var(--color-primary);
}
.shipping-field input::placeholder {
  color: var(--color-text);
  opacity: 1;
}
.routes-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}
.route-card {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 18px;
  padding: 26px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
}
.route-top {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.route-top > span:last-child {
  color: var(--color-text-secondary);
  font-size: 11px;
}
.route-icon {
  display: grid;
  place-items: center;
  width: 50px;
  height: 50px;
  border-radius: 16px;
}
.green {
  background: #e7ecdd;
}
.peach {
  background: #fff0e6;
}
.purple {
  background: #ece9f4;
}
.route-card h3 {
  font-size: 22px;
  font-weight: 700;
}
.route-description {
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.8;
}
.route-meta {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 8px;
  padding-block: 14px;
  border-block: 1px solid var(--color-border);
  font-size: 12px;
}
.route-meta p:last-child {
  color: var(--color-text-secondary);
}
.route-card > button {
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 700;
}
.stories-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}
.story-card {
  overflow: hidden;
  border-radius: 16px;
  background: white;
}
.story-card > img {
  display: block;
  width: 100%;
  height: 280px;
  object-fit: cover;
}
.story-copy {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 22px;
}
.story-copy > p,
.story-copy button > span {
  color: var(--color-text-secondary);
  font-size: 11px;
}
.story-copy h3 {
  font-size: 20px;
  font-weight: 700;
}
.story-copy button {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.help-section {
  display: flex;
  gap: 100px;
  padding-block: 64px;
}
.help-copy {
  display: flex;
  flex: 0 0 360px;
  flex-direction: column;
  align-items: start;
  gap: 18px;
}
.help-copy .eyebrow {
  font-weight: 400;
}
.help-copy h2 {
  font-size: 36px;
  font-weight: 700;
  line-height: 1.4;
}
.help-description {
  color: var(--color-text-secondary);
  font-size: 15px;
  line-height: 1.8;
}
.contact-link {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text-secondary);
  font-size: 13px;
}
.faq-list {
  flex: 1;
  min-width: 0;
}
.faq-item {
  padding-block: 20px;
  border-bottom: 1px solid var(--color-border);
}
.faq-item h3 button {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  text-align: left;
  font-size: 16px;
  font-weight: 700;
}
.faq-item > p {
  margin-top: 16px;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.9;
}
.search-cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-block: 38px;
  background: #fff0e6;
}
.search-cta > div {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.search-cta h2 {
  font-size: 28px;
  font-weight: 700;
}
.search-cta p {
  color: var(--color-text-secondary);
  font-size: 14px;
}
.site-footer {
  display: flex;
  flex-direction: column;
  gap: 38px;
  padding-block: 52px 28px;
  background: #252823;
  color: white;
}
.footer-main {
  display: flex;
  gap: 80px;
}
.footer-brand {
  display: flex;
  flex: 0 0 370px;
  flex-direction: column;
  align-items: start;
  gap: 18px;
}
.footer-wordmark {
  font:
    700 34px/1.2 Inter,
    sans-serif;
}
.footer-brand > p {
  color: #c8cbc2;
  font-size: 14px;
  line-height: 1.8;
}
.social-links {
  display: flex;
  gap: 14px;
}
.social-links button {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #393e34;
}
.footer-group {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: start;
  gap: 16px;
}
.footer-group h2 {
  font-size: 14px;
  font-weight: 700;
}
.footer-group button {
  color: #c8cbc2;
  font-size: 12px;
}
.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding-top: 38px;
  border-top: 1px solid #484d43;
  color: #c8cbc2;
  font-size: 11px;
}
.footer-bottom > p {
  font-family: Inter, sans-serif;
}
.footer-bottom > div {
  display: flex;
  gap: 24px;
}
.mock-dialog {
  width: min(480px, calc(100vw - 32px));
  max-height: calc(100dvh - 48px);
  margin: auto;
  padding: 0;
  border: 0;
  border-radius: 20px;
  background: var(--color-background);
  color: var(--color-text);
}
.mock-dialog::backdrop {
  background: rgb(20 25 18 / 45%);
}
.dialog-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 20px;
  padding: 32px;
}
.dialog-close {
  position: absolute;
  top: 12px;
  right: 16px;
  font-size: 26px;
}
.dialog-content h2 {
  padding-right: 20px;
  font-size: 24px;
  font-weight: 700;
}
.dialog-content > p {
  overflow-wrap: anywhere;
  color: var(--color-text-secondary);
  line-height: 1.8;
}
.dialog-product {
  width: 100%;
  height: 240px;
  border-radius: 12px;
  object-fit: cover;
}
@media (min-width: 1441px) {
  .hero {
    gap: 42px;
  }
}
@media (max-width: 1199px) {
  .main-nav nav {
    gap: 18px;
  }
  .nav-tools {
    gap: 14px;
  }
  .hero {
    gap: 28px;
  }
  h1 {
    font-size: 44px;
  }
  .hero-description {
    font-size: 14px;
  }
  .search-help {
    flex-wrap: wrap;
  }
  .shortcut {
    padding: 16px;
    gap: 10px;
  }
  .offer-card {
    padding: 24px;
    gap: 16px;
  }
  .offer-copy h3 {
    font-size: 20px;
  }
  .offer-symbol {
    width: 76px;
    height: 76px;
  }
  .shipping-form {
    flex-wrap: wrap;
  }
  .shipping-form h3 {
    flex-basis: 100%;
  }
  .help-section {
    gap: 48px;
  }
  .help-copy {
    flex-basis: 310px;
  }
  .footer-main {
    gap: 40px;
  }
  .footer-brand {
    flex-basis: 310px;
  }
}
@media (max-width: 900px) {
  .main-nav {
    height: auto;
    min-height: 88px;
    flex-wrap: wrap;
    gap: 22px;
    padding-block: 22px;
  }
  .main-nav nav {
    order: 3;
    width: 100%;
    justify-content: space-between;
    gap: 12px;
  }
  .hero {
    flex-direction: column;
    align-items: stretch;
    padding-top: 36px;
  }
  .hero-copy {
    gap: 24px;
  }
  .hero-visual {
    flex: auto;
    height: 420px;
  }
  .hero-description {
    font-size: 16px;
  }
  .shortcuts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .offers-grid {
    grid-template-columns: 1fr;
  }
  .special-copy h3 {
    font-size: 24px;
  }
  .special-offer {
    gap: 24px;
  }
  .special-copy {
    padding-left: 24px;
  }
  .products-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .steps-grid,
  .assurances {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .routes-grid {
    grid-template-columns: 1fr;
  }
  .stories-grid {
    grid-template-columns: 1fr;
  }
  .story-card > img {
    height: 360px;
  }
  .help-section {
    flex-direction: column;
  }
  .help-copy {
    flex-basis: auto;
  }
  .search-cta {
    align-items: start;
    flex-direction: column;
  }
  .search-cta h2 {
    font-size: 25px;
  }
  .footer-main {
    flex-wrap: wrap;
  }
  .footer-brand {
    flex-basis: 100%;
  }
  .footer-bottom {
    align-items: start;
    flex-direction: column;
  }
}
@media (max-width: 600px) {
  .page-width {
    padding-inline: 20px;
  }
  .announcement {
    height: auto;
    min-height: 34px;
    flex-wrap: wrap;
    gap: 5px 12px;
    padding: 10px 16px;
    font-size: 10px;
  }
  .wordmark {
    font-size: 24px;
  }
  .nav-tools {
    gap: 12px;
  }
  .register {
    display: none;
  }
  .main-nav nav {
    overflow-x: auto;
    font-size: 12px;
  }
  h1 {
    font-size: 36px;
  }
  .hero-eyebrow {
    font-size: 10px;
  }
  .hero-description {
    font-size: 13px;
  }
  .hero-visual {
    height: 330px;
  }
  .search-form {
    height: 64px;
    gap: 8px;
  }
  .search-field {
    padding-left: 4px;
    gap: 8px;
  }
  .search-field input {
    font-size: 12px;
  }
  .search-form .primary-button {
    padding-inline: 14px;
    gap: 7px;
    font-size: 12px;
  }
  .search-help {
    font-size: 10px;
  }
  .hero-benefits {
    gap: 14px;
    font-size: 12px;
  }
  .shortcuts {
    gap: 12px;
  }
  .shortcut {
    padding: 14px 12px;
  }
  .shortcut-copy strong {
    font-size: 13px;
  }
  .shortcut-copy > span {
    font-size: 10px;
  }
  .shortcut > :last-child {
    display: none;
  }
  .section {
    padding-block: 44px;
  }
  .offer-card {
    padding: 22px;
  }
  .offer-copy h3 {
    font-size: 18px;
  }
  .offer-description {
    font-size: 12px;
  }
  .offer-symbol {
    width: 64px;
    height: 64px;
  }
  .special-offer {
    height: auto;
    flex-direction: column;
    gap: 0;
  }
  .special-copy {
    width: 100%;
    padding: 26px;
  }
  .special-offer > img {
    width: 100%;
    height: 220px;
  }
  .category-tabs {
    gap: 8px;
  }
  .category-tabs button {
    padding: 10px 16px;
    font-size: 12px;
  }
  .products-grid {
    gap: 24px 14px;
  }
  .steps-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  .step {
    padding-right: 0;
  }
  .assurances {
    gap: 24px;
  }
  .shipping-form {
    padding: 18px;
  }
  .shipping-field {
    flex-basis: 100%;
  }
  .shipping-form .primary-button {
    width: 100%;
    justify-content: center;
  }
  .story-card > img {
    height: 280px;
  }
  .help-section {
    padding-block: 44px;
  }
  .help-copy h2 {
    font-size: 30px;
  }
  .faq-item h3 button {
    font-size: 14px;
  }
  .footer-main {
    gap: 30px 20px;
  }
  .footer-group {
    flex: 1 1 28%;
  }
  .footer-bottom > div {
    flex-wrap: wrap;
    gap: 16px;
  }
}
/* Figma 的文本框按像素取整；内描边不参与内容尺寸计算。 */
.shortcut-copy > span,
.search-help,
.photo-caption p,
.assurances p,
.route-meta,
.footer-group button {
  line-height: 14px;
}
.shortcut-copy strong {
  line-height: 18px;
}
.section-note,
.story-copy > p,
.story-copy button > span,
.route-top > span:last-child,
.footer-bottom {
  line-height: 13px;
}
.category-tabs button,
.route-card > button {
  line-height: 16px;
}
.offer-label {
  line-height: 14px;
}
.offer-copy h3 {
  line-height: 29px;
}
.offer-copy button,
.special-copy > p:not(.eyebrow),
.footer-group h2,
.search-cta p {
  line-height: 17px;
}
.offer-description {
  line-height: 21px;
}
.special-copy .eyebrow {
  line-height: 13px;
}
.special-copy h3 {
  line-height: 36px;
}
.assurances h3,
.faq-item h3 button {
  line-height: 19px;
}
.step > p,
.route-description {
  line-height: 25px;
}
.route-card h3 {
  line-height: 26px;
}
.story-copy h3 {
  line-height: 24px;
}
.help-copy h2 {
  line-height: 50px;
}
.faq-item > p {
  line-height: 27px;
}
.search-cta h2 {
  line-height: 34px;
}
.footer-wordmark {
  line-height: 41px;
}
.footer-brand > p {
  line-height: 25px;
}
.shipping-field {
  height: 53px;
}
.shipping-field > span {
  line-height: 12px;
}
.shipping-field input,
.shipping-field select {
  line-height: 16px;
}
.route-card,
.route-meta,
.faq-item {
  border: 0;
  box-shadow: inset 0 0 0 1px var(--color-border);
}
.route-meta {
  box-shadow:
    inset 0 1px var(--color-border),
    inset 0 -1px var(--color-border);
}
.faq-item {
  box-shadow: inset 0 -1px var(--color-border);
}
.assurances {
  border: 0;
  box-shadow: inset 0 1px #484d43;
}
.footer-bottom {
  border-top: 1px solid #484d43;
}
@media (max-width: 900px) {
  .help-copy h2 {
    line-height: 1.4;
  }
  .offer-copy h3,
  .special-copy h3,
  .search-cta h2 {
    line-height: 1.3;
  }
}
</style>
