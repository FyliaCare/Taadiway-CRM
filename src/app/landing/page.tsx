"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, CheckCircle, Warehouse, TrendingUp, Users, 
  BarChart3, Package, Clock, Shield, Star, Zap,
  MessageSquare, Globe, Smartphone, DollarSign,
  Target, Award, HeartHandshake, Phone, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center gap-2">
                <Image 
                  src="/logo.png" 
                  alt="Taadiway Logo" 
                  width={140} 
                  height={40}
                  className="h-10 w-auto"
                />
              </Link>
            </div>
            <div className="hidden md:flex md:items-center md:gap-8">
              <a href="#features" className="text-sm font-medium text-gray-700 hover:text-yellow-600 transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-sm font-medium text-gray-700 hover:text-yellow-600 transition-colors">
                Pricing
              </a>
              <a href="#benefits" className="text-sm font-medium text-gray-700 hover:text-yellow-600 transition-colors">
                Benefits
              </a>
              <a href="#testimonials" className="text-sm font-medium text-gray-700 hover:text-yellow-600 transition-colors">
                Testimonials
              </a>
              <Link href="/auth/signin">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
              <Link href="#get-started">
                <Button size="sm" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-24">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50" />
          <div className="absolute left-1/2 top-0 -z-10 -translate-x-1/2 blur-3xl xl:-top-6" aria-hidden="true">
            <div
              className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-yellow-400 to-orange-400 opacity-30"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-700">
              <Star className="h-4 w-4 fill-yellow-700" />
              Trusted by 500+ Vendors Across West Africa
            </div>
            <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              Revolutionize Your{" "}
              <span className="bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Delivery Business
              </span>{" "}
              in the Western Region
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
              Focus on what matters most - client acquisition and sales. Let Taadiway handle warehousing, 
              inventory tracking, and real-time analytics while you watch your business grow.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="#get-started">
                <Button size="lg" className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-lg px-8 py-6">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#demo">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-yellow-600 text-yellow-700 hover:bg-yellow-50">
                  Watch Demo
                </Button>
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>

          {/* Hero Image/Dashboard Preview */}
          <div className="mt-16 flow-root sm:mt-24">
            <div className="relative rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:rounded-2xl lg:p-4">
              <div className="aspect-[16/10] w-full rounded-md bg-gradient-to-br from-yellow-500 via-orange-500 to-amber-600 shadow-2xl ring-1 ring-gray-900/10">
                <div className="flex h-full items-center justify-center text-white text-2xl font-bold">
                  Dashboard Preview
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                500+
              </div>
              <div className="mt-2 text-sm text-gray-600">Active Vendors</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                2M+
              </div>
              <div className="mt-2 text-sm text-gray-600">Products Managed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                ₵50M+
              </div>
              <div className="mt-2 text-sm text-gray-600">Sales Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                99.9%
              </div>
              <div className="mt-2 text-sm text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold leading-7 text-yellow-600">Everything You Need</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Powerful Features for Modern Vendors
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              All the tools you need to run a successful delivery business in one platform
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Warehouse,
                title: "Taadiway Warehouse Access",
                description: "Store your products in our state-of-the-art warehouses across the Western Region. We handle storage, security, and climate control.",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: BarChart3,
                title: "Real-Time Inventory Tracking",
                description: "Get instant updates as your products move. Know exactly what's in stock, what's selling, and when to restock.",
                gradient: "from-purple-500 to-pink-500"
              },
              {
                icon: TrendingUp,
                title: "Sales Analytics & Reports",
                description: "Comprehensive dashboards showing your sales performance, trends, and forecasts. Make data-driven decisions.",
                gradient: "from-pink-500 to-orange-500"
              },
              {
                icon: Users,
                title: "Client Management",
                description: "Manage all your clients in one place. Track orders, preferences, and communication history effortlessly.",
                gradient: "from-orange-500 to-yellow-500"
              },
              {
                icon: Package,
                title: "Automated Stock Alerts",
                description: "Never run out of stock. Get alerts via SMS, WhatsApp, or email when inventory runs low.",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: Globe,
                title: "Multi-Location Coverage",
                description: "Serve customers across Accra, Kumasi, Takoradi, and beyond. We deliver where your clients are.",
                gradient: "from-cyan-500 to-blue-500"
              },
              {
                icon: Smartphone,
                title: "Mobile Access Anywhere",
                description: "Manage your business on the go. Full mobile access to all features via web or mobile app.",
                gradient: "from-indigo-500 to-purple-500"
              },
              {
                icon: MessageSquare,
                title: "WhatsApp & SMS Integration",
                description: "Automatic notifications to you and your clients via WhatsApp, SMS, and email for every transaction.",
                gradient: "from-violet-500 to-fuchsia-500"
              },
              {
                icon: Shield,
                title: "Secure & Reliable",
                description: "Bank-level security, daily backups, and 99.9% uptime guarantee. Your data is always safe.",
                gradient: "from-red-500 to-pink-500"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:scale-105"
              >
                <div className={`inline-flex rounded-lg bg-gradient-to-r ${feature.gradient} p-3 text-white shadow-lg`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="bg-gradient-to-br from-yellow-500 via-orange-500 to-amber-600 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Why Choose Taadiway?
            </h2>
            <p className="mt-6 text-lg text-yellow-50">
              Join hundreds of successful vendors who&apos;ve transformed their businesses
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2">
            {[
              {
                icon: Target,
                title: "Focus on Sales, Not Logistics",
                description: "Stop worrying about warehousing, inventory counts, and stock management. We handle it all so you can focus on growing your customer base and closing deals."
              },
              {
                icon: DollarSign,
                title: "Reduce Operating Costs by 40%",
                description: "Save on warehouse rent, staff salaries, and operational overhead. Pay only for the space you use with our flexible pricing model."
              },
              {
                icon: Zap,
                title: "Launch in 24 Hours",
                description: "From signup to first delivery in just one day. No complex setup, no technical skills needed. We guide you every step of the way."
              },
              {
                icon: Award,
                title: "Increase Sales by 3x",
                description: "Our vendors report an average 3x increase in sales within 6 months thanks to better inventory management and faster delivery times."
              },
              {
                icon: Clock,
                title: "Save 20+ Hours Weekly",
                description: "Automate inventory tracking, reporting, and client communication. Spend your time on what matters - growing your business."
              },
              {
                icon: HeartHandshake,
                title: "Dedicated Support Team",
                description: "24/7 customer support in English, Twi, and Hausa. Your success is our success, and we&apos;re here to help you thrive."
              }
            ].map((benefit, index) => (
              <div key={index} className="rounded-2xl bg-white/10 backdrop-blur-lg p-8 border border-white/20">
                <benefit.icon className="h-10 w-10 text-white" />
                <h3 className="mt-4 text-xl font-semibold text-white">{benefit.title}</h3>
                <p className="mt-2 text-yellow-50">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold leading-7 text-yellow-600">Pricing</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Simple, Transparent Pricing
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Choose the plan that fits your business size. All plans include warehouse access.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Starter Plan */}
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900">Starter</h3>
              <p className="mt-2 text-sm text-gray-600">Perfect for small vendors just getting started</p>
              <p className="mt-6">
                <span className="text-4xl font-bold text-gray-900">₵299</span>
                <span className="text-gray-600">/month</span>
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Up to 100 products",
                  "5 cubic meters warehouse space",
                  "Basic analytics dashboard",
                  "Email & SMS notifications",
                  "Client management portal",
                  "Mobile app access",
                  "Email support"
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="#get-started">
                <Button className="mt-8 w-full bg-gray-900 hover:bg-gray-800">
                  Start Free Trial
                </Button>
              </Link>
            </div>

            {/* Professional Plan */}
            <div className="relative rounded-3xl border-2 border-yellow-500 bg-white p-8 shadow-xl scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="inline-flex rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-1 text-sm font-semibold text-white">
                  Most Popular
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Professional</h3>
              <p className="mt-2 text-sm text-gray-600">For growing businesses with multiple products</p>
              <p className="mt-6">
                <span className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  ₵699
                </span>
                <span className="text-gray-600">/month</span>
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Up to 500 products",
                  "20 cubic meters warehouse space",
                  "Advanced analytics & reports",
                  "WhatsApp, Email & SMS notifications",
                  "Multi-user access (up to 5 staff)",
                  "Priority delivery slots",
                  "Custom branding",
                  "API access",
                  "Priority support (24/7)"
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="#get-started">
                <Button className="mt-8 w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                  Start Free Trial
                </Button>
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900">Enterprise</h3>
              <p className="mt-2 text-sm text-gray-600">For large-scale operations</p>
              <p className="mt-6">
                <span className="text-4xl font-bold text-gray-900">₵1,499</span>
                <span className="text-gray-600">/month</span>
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Unlimited products",
                  "50+ cubic meters warehouse space",
                  "Custom analytics & AI insights",
                  "All notification channels",
                  "Unlimited users",
                  "Dedicated account manager",
                  "Custom integrations",
                  "White-label options",
                  "SLA guarantee",
                  "On-site training",
                  "24/7 priority support"
                ].map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="#get-started">
                <Button className="mt-8 w-full bg-orange-600 hover:bg-orange-700">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600">
              All plans include: Free onboarding • No setup fees • Cancel anytime • 14-day money-back guarantee
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Loved by Vendors Across West Africa
            </h2>
            <p className="mt-6 text-lg text-gray-600">
              See what our customers have to say about their experience
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                name: "Kwame Mensah",
                role: "Beverage Distributor, Accra",
                content: "Taadiway transformed my business! I went from managing 5 clients to over 50 in just 3 months. The real-time inventory tracking means I never miss a sale.",
                rating: 5
              },
              {
                name: "Abena Osei",
                role: "Cosmetics Vendor, Kumasi",
                content: "I was skeptical at first, but Taadiway exceeded all expectations. The warehouse space saved me ₵2,000/month in rent alone. Best decision I ever made!",
                rating: 5
              },
              {
                name: "Mohammed Abdul",
                role: "Electronics Trader, Takoradi",
                content: "The analytics dashboard helped me identify my best-selling products. I increased my profits by 60% in the first quarter. Taadiway is a game-changer!",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="rounded-2xl bg-white p-8 shadow-sm">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 italic">&ldquo;{testimonial.content}&rdquo;</p>
                <div className="mt-6">
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="get-started" className="relative overflow-hidden bg-gradient-to-r from-yellow-500 to-orange-500 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Transform Your Business?
            </h2>
            <p className="mt-6 text-lg text-yellow-50">
              Join 500+ vendors who are already growing with Taadiway
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signin">
                <Button size="lg" className="bg-white text-yellow-700 hover:bg-gray-100 text-lg px-8 py-6">
                  Start Your 14-Day Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="tel:+233559220442">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                  <Phone className="mr-2 h-5 w-5" />
                  Call 0559 220 442
                </Button>
              </a>
            </div>
            <p className="mt-6 text-sm text-yellow-50">
              Questions? Call us or WhatsApp 0559 220 442
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Image 
                src="/logo.png" 
                alt="Taadiway Logo" 
                width={140} 
                height={40}
                className="h-10 w-auto mb-4"
              />
              <p className="text-gray-400 text-sm">
                Revolutionizing delivery businesses across the Western Region with smart warehousing and real-time analytics.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#benefits" className="hover:text-white transition-colors">Benefits</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  info@taadiway.com
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  0559 220 442
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp: 0559 220 442
                </li>
                <li>Western Region, Ghana</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 Taadiway. All rights reserved. Made with ❤️ in Ghana</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
