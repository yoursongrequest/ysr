import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Banknote, DollarSign, Send } from 'lucide-react';

const PayoutsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const PLATFORM_COMMISSION = 0.20;

  useEffect(() => {
    if (user) {
      const savedTransactions = JSON.parse(localStorage.getItem(`ysr_transactions_${user.id}`) || '[]');
      setTransactions(savedTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }
  }, [user]);

  const totalEarnings = transactions.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const afterCommission = totalEarnings * (1 - PLATFORM_COMMISSION);

  const handleRequestPayout = () => {
    toast({
      title: "Payout Request Sent!",
      description: "Your request has been sent to the administrator for manual processing.",
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Helmet>
        <title>Payouts - Your Song Request</title>
        <meta name="description" content="View your earnings and request payouts." />
      </Helmet>

      <div className="min-h-screen bg-black text-white">
        <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center">
                <Link to="/admin" className="inline-flex items-center text-blue-400 hover:text-blue-300 mr-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
                <span className="text-2xl font-bold neon-text">Payouts</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <Card className="glass-effect border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Gross Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">£{totalEarnings.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card className="glass-effect border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">Platform Commission (20%)</CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-400">- £{(totalEarnings * PLATFORM_COMMISSION).toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card className="glass-effect border-green-500/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-400">Your Net Earnings</CardTitle>
                  <Banknote className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-400">£{afterCommission.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass-effect border-gray-800">
              <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>A list of all your completed song requests and tips.</CardDescription>
                </div>
                <Button onClick={handleRequestPayout} className="bg-blue-600 hover:bg-blue-700 mt-4 md:mt-0 neon-glow">
                  <Send className="w-4 h-4 mr-2" />
                  Request Payout
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length > 0 ? (
                      transactions.map(tx => (
                        <TableRow key={tx.id} className="border-gray-800">
                          <TableCell>{formatDate(tx.createdAt)}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tx.isTipOnly ? 'bg-yellow-900 text-yellow-300' : 'bg-blue-900 text-blue-300'}`}>
                              {tx.isTipOnly ? 'Tip' : 'Request'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {tx.isTipOnly ? `From ${tx.requesterName}` : `${tx.songTitle} by ${tx.requesterName}`}
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-400">+£{tx.amountPaid.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center h-24 text-gray-500">
                          No transactions yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default PayoutsPage;