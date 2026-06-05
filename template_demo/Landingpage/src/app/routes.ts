import { createBrowserRouter } from "react-router"
import Root from "./Root"
import HomePage from "./pages/HomePage"
import PricingPage from "./pages/PricingPage"
import DemoPage from "./pages/DemoPage"
import CustomersPage from "./pages/CustomersPage"
import BlogPage from "./pages/BlogPage"
import BlogPostPage from "./pages/BlogPostPage"
import CompareExcelPage from "./pages/CompareExcelPage"
import IntegrationsPage from "./pages/IntegrationsPage"
import FeaturesIndexPage from "./pages/features/FeaturesIndexPage"
import FeaturePage from "./pages/features/FeaturePage"

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: HomePage },
      { path: "bang-gia", Component: PricingPage },
      { path: "dat-lich-demo", Component: DemoPage },
      { path: "khach-hang", Component: CustomersPage },
      { path: "blog", Component: BlogPage },
      { path: "blog/:slug", Component: BlogPostPage },
      { path: "so-sanh/jobihome-vs-excel", Component: CompareExcelPage },
      { path: "tich-hop", Component: IntegrationsPage },
      { path: "tinh-nang", Component: FeaturesIndexPage },
      { path: "tinh-nang/:slug", Component: FeaturePage },
    ],
  },
])
