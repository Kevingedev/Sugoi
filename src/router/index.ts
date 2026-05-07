import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import ForumView from "../views/ForumView.vue";
import TopicDetailView from "../views/TopicDetailView.vue";
import FilterView from "../views/FilterView.vue";
import NewsView from '../views/NewsView.vue'
import NewsDetailView from '../views/NewsDetailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0, behavior: 'smooth' };
    }
  },
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: '/noticias',
      name: 'news',
      component: NewsView,
    },
    {
      path: '/noticias/:source/:parentId/:newsId',
      name: 'news-detail',
      component: NewsDetailView,
    },
    {
      path: '/forum',
      name: 'forum',
      component: ForumView,
    },
    {
      path: "/filtros",
      name: "filter",
      component: FilterView,
    },
    {
      path: "/forum/topic/:id",
      name: "topic-detail",
      component: TopicDetailView,
    },
    {
      path: '/create-skin',
      name: 'create-skin',
      component: () => import('../views/SkinView.vue')
    },
    {
      path: '/description/:type/:id',
      name: 'description',
      component: () => import('../views/DescriptionView.vue'),
      props: true
    },
    {
      path: '/sign-in',
      name: 'sign-in',
      component: () => import('../views/AuthView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/sign-up',
      name: 'sign-up',
      component: () => import('../views/AuthView.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/tracking',
      name: 'tracking',
      component: () => import('../views/TrackingView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/privacidad',
      name: 'privacy-policy',
      component: () => import('../views/PrivacyPolicyView.vue')
    },
    {
      path: '/terminos',
      name: 'terms-of-service',
      component: () => import('../views/TermsOfServiceView.vue')
    }
  ],
});

router.beforeEach((to, from, next) => {
  const authSession = localStorage.getItem('sugoi_auth_session');
  const isAuthenticated = !!authSession;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'sign-in' });
  } else if (to.meta.guestOnly && isAuthenticated) {
    next({ name: 'home' });
  } else {
    next();
  }
});

export default router;
