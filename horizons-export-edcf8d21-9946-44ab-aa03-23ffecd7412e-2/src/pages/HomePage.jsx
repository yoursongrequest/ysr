import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Music, Users, Calendar, DollarSign } from 'lucide-react';
const HomePage = () => {
  return <>
      <Helmet>
        <title>Your Song Request - Connect Musicians with Their Audience</title>
        <meta name="description" content="The ultimate platform for musicians to manage and receive paid song requests from their audience during live performances." />
        <meta property="og:title" content="Your Song Request - Connect Musicians with Their Audience" />
        <meta property="og:description" content="The ultimate platform for musicians to manage and receive paid song requests from their audience during live performances." />
      </Helmet>

      <div className="min-h-screen bg-black text-white overflow-hidden">
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-cyan-900/20"></div>
          
          <motion.div initial={{
          opacity: 0,
          y: 50
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8
        }} className="relative z-10 text-center max-w-4xl mx-auto">
            <motion.h1 className="text-5xl md:text-7xl font-black mb-6 neon-text" initial={{
            opacity: 0,
            scale: 0.8
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            duration: 1,
            delay: 0.2
          }}>
              Your Song Request
            </motion.h1>
            
            <motion.p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto" initial={{
            opacity: 0
          }} animate={{
            opacity: 1
          }} transition={{
            duration: 0.8,
            delay: 0.4
          }}>Connecting artists with their audience through paid song requests during live performances</motion.p>

            <motion.div className="flex flex-col sm:flex-row gap-4 justify-center items-center" initial={{
            opacity: 0,
            y: 30
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8,
            delay: 0.6
          }}>
              <Link to="/signup">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold neon-glow">
                  Get Started as Artist
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black px-8 py-3 text-lg font-semibold">
                  Artist Login
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Floating Elements */}
          <motion.div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/20 rounded-full blur-xl" animate={{
          y: [0, -20, 0],
          x: [0, 10, 0]
        }} transition={{
          duration: 6,
          repeat: Infinity
        }} />
          <motion.div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-xl" animate={{
          y: [0, 20, 0],
          x: [0, -15, 0]
        }} transition={{
          duration: 8,
          repeat: Infinity
        }} />
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.h2 className="text-4xl md:text-5xl font-bold text-center mb-16" initial={{
            opacity: 0,
            y: 30
          }} whileInView={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8
          }} viewport={{
            once: true
          }}>
              Why Choose YSR?
            </motion.h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[{
              icon: Music,
              title: "Song Management",
              description: "Easily manage your setlist with custom pricing for each song"
            }, {
              icon: Users,
              title: "Audience Connection",
              description: "Let your fans request their favorite songs during live shows"
            }, {
              icon: Calendar,
              title: "Gig Scheduling",
              description: "Organize your performances with our built-in calendar system"
            }, {
              icon: DollarSign,
              title: "Monetize Requests",
              description: "Earn extra income from song requests with custom pricing"
            }].map((feature, index) => <motion.div key={index} className="glass-effect p-6 rounded-xl text-center" initial={{
              opacity: 0,
              y: 50
            }} whileInView={{
              opacity: 1,
              y: 0
            }} transition={{
              duration: 0.6,
              delay: index * 0.1
            }} viewport={{
              once: true
            }} whileHover={{
              scale: 1.05
            }}>
                  <feature.icon className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </motion.div>)}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <motion.div className="max-w-4xl mx-auto text-center glass-effect p-12 rounded-2xl" initial={{
          opacity: 0,
          scale: 0.9
        }} whileInView={{
          opacity: 1,
          scale: 1
        }} transition={{
          duration: 0.8
        }} viewport={{
          once: true
        }}>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Live Performances?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join musicians who are already earning more and connecting better with their audience
            </p>
            <Link to="/signup">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-xl font-semibold neon-glow">
                Start Your Journey
              </Button>
            </Link>
          </motion.div>
        </section>
      </div>
    </>;
};
export default HomePage;