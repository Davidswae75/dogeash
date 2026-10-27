import Toast, { POSITION, type PluginOptions } from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import '~/assets/css/toast.css'

// Toasts confirm what a buyer just did. Use them through useNotify(), not useToast() directly,
// so every action gets the right type, icon and wording.
export default defineNuxtPlugin((nuxtApp) => {
  const options: PluginOptions = {
    position: POSITION.TOP_RIGHT,
    timeout: 4200, // useNotify sets one per tone
    maxToasts: 3,
    newestOnTop: true,
    closeOnClick: false,
    pauseOnHover: true,
    pauseOnFocusLoss: true,
    draggable: true,
    draggablePercent: 0.4,
    hideProgressBar: false,
    icon: false, // ToastContent draws its own icon or the dog's photo
    closeButton: 'button',
    transition: 'dogeash-toast', // keyframes in toast.css,
  }
  nuxtApp.vueApp.use(Toast, options)
})
