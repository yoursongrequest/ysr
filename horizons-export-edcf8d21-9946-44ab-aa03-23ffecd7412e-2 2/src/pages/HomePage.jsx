import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ListMusic, QrCode, PoundSterling, Settings, BarChart, Users, Heart } from 'lucide-react';
import Header from '@/components/landing/Header';
const FeatureBenefitCard = ({
  icon: Icon,
  title,
  description,
  delay
}) => <motion.div initial={{
  opacity: 0,
  y: 20
}} whileInView={{
  opacity: 1,
  y: 0
}} transition={{
  duration: 0.5,
  delay
}} viewport={{
  once: true
}} className="flex items-start space-x-4">
    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
      <Icon className="w-6 h-6 text-blue-400" />
    </div>
    <div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="mt-1 text-gray-400">{description}</p>
    </div>
  </motion.div>;
const HomePage = () => {
  return <>
      <Helmet>
        <title>Your Song Request - Turn Applause into Earnings</title>
        <meta name="description" content="The platform that lets your audience pay to hear their favourite songs from your setlist, turning engagement into direct revenue during your live gigs." />
        <meta property="og:title" content="Your Song Request - Turn Applause into Earnings" />
        <meta property="og:description" content="The platform that lets your audience pay to hear their favourite songs from your setlist, turning engagement into direct revenue during your live gigs." />
        <meta property="og:image" content="https://images.unsplash.com/photo-1516280440614-376394488844?q=80&w=2070&auto=format&fit=crop" />
        <link rel="canonical" href="https://yoursongrequest.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
      </Helmet>

      <div className="min-h-screen bg-gray-900 text-gray-200 font-['Inter']">
        <Header />
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center text-center px-4">
          <div className="absolute inset-0 overflow-hidden">
            <img alt="A musician performing with a guitar in a dimly lit venue" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1494403912729-e619111312dd" />
            <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm"></div>
          </div>
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8,
          ease: 'easeOut'
        }} className="relative z-10">
            <h1 className="text-5xl md:text-7xl font-bold text-white multi-glow-1">
              From Applause to Earnings.
            </h1>
            <p className="max-w-3xl mx-auto mt-4 text-lg md:text-xl text-gray-300">
              The tip jar is dead. Your Song Request is the platform that lets your audience pay to hear their favourite songs from your setlist, turning engagement into direct revenue during your live gigs.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 px-8 rounded-lg neon-glow transform hover:scale-105 transition-transform duration-300">
                  Start Earning Tonight!
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="lg" variant="outline" className="text-white border-white/50 hover:bg-white/10 hover:text-white font-bold text-lg py-4 px-8 rounded-lg transform hover:scale-105 transition-transform duration-300">
                  Sign Up Now!
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Social Proof Bar */}
        <section className="py-8 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-semibold text-gray-400 tracking-widest uppercase">
              POWERING ARTISTS IN PUBS, BARS, AND VENUES ACROSS THE UK
            </p>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 sm:py-28 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white multi-glow-2">It’s as Easy <br className="sm:hidden" /> as 1, 2, 3.</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <motion.div initial={{
              opacity: 0,
              y: 50
            }} whileInView={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.5,
              delay: 0.1
            }} viewport={{
              once: true
            }}>
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-6">
                  <ListMusic className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Build Your Setlist</h3>
                <p className="mt-2 text-gray-400">Sign up for free and add your entire repertoire of songs. Set your price for each request.</p>
              </motion.div>
              <motion.div initial={{
              opacity: 0,
              y: 50
            }} whileInView={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.5,
              delay: 0.2
            }} viewport={{
              once: true
            }}>
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-6">
                  <QrCode className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Go Live</h3>
                <p className="mt-2 text-gray-400">When your gig starts, share your unique QR/URL code with the audience. No app download needed..</p>
              </motion.div>
              <motion.div initial={{
              opacity: 0,
              y: 50
            }} whileInView={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.5,
              delay: 0.3
            }} viewport={{
              once: true
            }}>
                <div className="mx-auto w-16 h-16 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-6">
                  <PoundSterling className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold text-white">Get Paid</h3>
                <p className="mt-2 text-gray-400">Watch paid requests roll in on your live dashboard. Control the show and cash out your earnings.</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features & Benefits Section */}
        <section className="py-20 sm:py-28 bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 multi-glow-3">Your Stage, Your Rules. ((CHANGE IMAGE)).</h2>
            <motion.div initial={{
            opacity: 0,
            scale: 0.9
          }} whileInView={{
            opacity: 1,
            scale: 1
          }} transition={{
            duration: 0.6
          }} viewport={{
            once: true
          }} className="mb-16">
              <img alt="A screenshot of the Your Song Request artist dashboard on a tablet" className="rounded-xl shadow-2xl shadow-blue-900/20" src="https://images.unsplash.com/photo-1686061594225-3e92c0cd51b0" />
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 text-left">
              <FeatureBenefitCard icon={Settings} title="Total Setlist Control" description="You decide which songs are available and set your own prices. Mark songs as 'played' to remove them from the list for the rest of the night. Giving you full control of pacing and genre/style of your set as you normally do." delay={0.1} />
              <FeatureBenefitCard icon={BarChart} title="A Real-Time Dashboard" description="Manage incoming requests, see your earnings stack up, and control the flow of your gig—all from your phone or tablet. You can even control it whilst playing the guitar, you big show off! It's that easy!" delay={0.2} />
              <FeatureBenefitCard icon={Users} title="Engage Your Audience" description="Give your fans a direct way to participate in the show. A paid request is the ultimate compliment and a great way to build a memorable connection." delay={0.3} />
              <FeatureBenefitCard icon={Heart} title="More Than Just a Tip Jar" description="Unlike a passive tip jar, YSR is an interactive experience that adds value to both you and your audience, leading to significantly higher earnings." delay={0.4} />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 sm:py-28 bg-black">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white multi-glow-4">Simple, Transparent Pricing.</h2>
            <p className="mt-4 text-lg text-gray-400">No monthly fees. No setup costs. No surprises.</p>
            <p className="mt-6 text-gray-300">It's completely free to sign up and list your songs. We only make money when you do. YSR keeps a 20% platform fee from the total of each transaction. You can price your songs/requests however you like. This covers all card processing fees, platform hosting, and continued development to bring you more features.</p>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 sm:py-28 bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white multi-glow-5">Ready to Transform Your Live Gigs?</h2>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              Stop leaving money on the table. Give your audience what they want and get paid for it.
            </p>
            <Link to="/signup">
              <Button size="lg" className="mt-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 px-8 rounded-lg neon-glow transform hover:scale-105 transition-transform duration-300">
                Claim Your Stage & Sign Up Free
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>;
};
export default HomePage;