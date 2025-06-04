'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, COLLECTIONS } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import LogoutButton from '@/components/LogoutButton';

interface DashboardStats {
  users: number;
  products: number;
  marketReports: number;
  matchmakingReports: number;
  visibilityReports: number;
}

interface User {
  uid: string;
  email: string;
  company: string;
  sector: string;
  userType: 'supplier' | 'buyer';
  createdAt: Timestamp;
}

interface Product {
  id: string;
  name: string;
  sector: string;
  createdBy: string;
  createdAt: Timestamp;
}

interface MarketReport {
  id: string;
  productId: string;
  productName: string;
  analysisText: string;
  generatedAt: Timestamp;
}

interface MatchmakingReport {
  id: string;
  productId: string;
  productName: string;
  matchedBuyers: Array<{
    companyName: string;
    companyDescription: string;
  }>;
  generatedAt: Timestamp;
}

interface VisibilityReport {
  id: string;
  productId: string;
  productName: string;
  seoText: string;
  emailPitch: string;
  generatedAt: Timestamp;
}

type TabType = 'users' | 'products' | 'market' | 'matchmaking' | 'visibility';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    products: 0,
    marketReports: 0,
    matchmakingReports: 0,
    visibilityReports: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [marketReports, setMarketReports] = useState<MarketReport[]>([]);
  const [matchmakingReports, setMatchmakingReports] = useState<MatchmakingReport[]>([]);
  const [visibilityReports, setVisibilityReports] = useState<VisibilityReport[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('users');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      if (user.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        setError('Access Denied: Admin privileges required');
        return;
      }

      try {
        await Promise.all([
          fetchDashboardStats(),
          fetchUsers(),
          fetchProducts(),
          fetchMarketReports(),
          fetchMatchmakingReports(),
          fetchVisibilityReports(),
        ]);
      } catch (err) {
        console.error('Error loading admin data:', err);
        setError('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchDashboardStats = async () => {
    const [
      usersSnapshot,
      productsSnapshot,
      marketReportsSnapshot,
      matchmakingReportsSnapshot,
      visibilityReportsSnapshot,
    ] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.USERS)),
      getDocs(collection(db, COLLECTIONS.PRODUCTS)),
      getDocs(collection(db, COLLECTIONS.MARKET_REPORTS)),
      getDocs(collection(db, COLLECTIONS.BUYER_MATCHES)),
      getDocs(collection(db, COLLECTIONS.VISIBILITY_REPORTS)),
    ]);

    setStats({
      users: usersSnapshot.size,
      products: productsSnapshot.size,
      marketReports: marketReportsSnapshot.size,
      matchmakingReports: matchmakingReportsSnapshot.size,
      visibilityReports: visibilityReportsSnapshot.size,
    });
  };

  const fetchUsers = async () => {
    const usersSnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
    const usersData = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
    })) as User[];
    setUsers(usersData);
  };

  const fetchProducts = async () => {
    const productsSnapshot = await getDocs(collection(db, COLLECTIONS.PRODUCTS));
    const productsData = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];
    setProducts(productsData);
  };

  const fetchMarketReports = async () => {
    const reportsSnapshot = await getDocs(collection(db, COLLECTIONS.MARKET_REPORTS));
    const reportsData = reportsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as MarketReport[];
    setMarketReports(reportsData);
  };

  const fetchMatchmakingReports = async () => {
    const reportsSnapshot = await getDocs(collection(db, COLLECTIONS.BUYER_MATCHES));
    const reportsData = reportsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as MatchmakingReport[];
    setMatchmakingReports(reportsData);
  };

  const fetchVisibilityReports = async () => {
    const reportsSnapshot = await getDocs(collection(db, COLLECTIONS.VISIBILITY_REPORTS));
    const reportsData = reportsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as VisibilityReport[];
    setVisibilityReports(reportsData);
  };

  const deleteUser = async (uid: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await deleteDoc(doc(db, COLLECTIONS.USERS, uid));
      await fetchUsers();
      await fetchDashboardStats();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await deleteDoc(doc(db, COLLECTIONS.PRODUCTS, id));
      await fetchProducts();
      await fetchDashboardStats();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage users, products, and reports
            </p>
          </div>
          <LogoutButton />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <p className="text-2xl font-semibold text-gray-900">{stats.users}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Products</h3>
            <p className="text-2xl font-semibold text-gray-900">{stats.products}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Market Reports</h3>
            <p className="text-2xl font-semibold text-gray-900">{stats.marketReports}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Matchmaking Reports</h3>
            <p className="text-2xl font-semibold text-gray-900">{stats.matchmakingReports}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Visibility Reports</h3>
            <p className="text-2xl font-semibold text-gray-900">{stats.visibilityReports}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`${
                activeTab === 'products'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('market')}
              className={`${
                activeTab === 'market'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Market Reports
            </button>
            <button
              onClick={() => setActiveTab('matchmaking')}
              className={`${
                activeTab === 'matchmaking'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Matchmaking Reports
            </button>
            <button
              onClick={() => setActiveTab('visibility')}
              className={`${
                activeTab === 'visibility'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Visibility Reports
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white shadow rounded-lg">
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sector
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.uid}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.company}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.sector}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.userType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => deleteUser(user.uid)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sector
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.sector}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.createdBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'market' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Analysis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Generated At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {marketReports.map((report) => (
                    <tr key={report.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.productName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-h-32 overflow-y-auto">
                          {report.analysisText}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.generatedAt.toDate().toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'matchmaking' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Matched Buyers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Generated At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {matchmakingReports.map((report) => (
                    <tr key={report.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.productName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-h-32 overflow-y-auto">
                          {report.matchedBuyers.map((buyer, index) => (
                            <div key={index} className="mb-2">
                              <strong>{buyer.companyName}</strong>
                              <p>{buyer.companyDescription}</p>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.generatedAt.toDate().toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'visibility' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SEO Text
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email Pitch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Generated At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {visibilityReports.map((report) => (
                    <tr key={report.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.productName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-h-32 overflow-y-auto">
                          {report.seoText}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-h-32 overflow-y-auto">
                          {report.emailPitch}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.generatedAt.toDate().toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 