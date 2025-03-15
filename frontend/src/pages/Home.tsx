import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useAuth } from '@/contexts';
import LoadingScreen from '@/components/LoadingScreen';
import { Link } from 'react-router-dom';
import { FaUserFriends, FaFutbol, FaClipboardList, FaTrophy } from 'react-icons/fa';

const Home: React.FC = () => {
  const { loginWithRedirect } = useAuth0();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading screen when authentication is in progress
  if (isLoading) {
    return <LoadingScreen />;
  }

  const features = [
    {
      icon: <FaUserFriends className="text-4xl text-green-600" />,
      title: 'Connect with Friends',
      description: 'Add your football buddies and track stats together.',
      link: '/friends'
    },
    {
      icon: <FaFutbol className="text-4xl text-green-600" />,
      title: 'Track Matches',
      description: 'Record match details, goals, assists and more.',
      link: '/matches'
    },
    {
      icon: <FaClipboardList className="text-4xl text-green-600" />,
      title: 'Validate Stats',
      description: 'Friends validate each other\'s match data for accuracy.',
      link: '/validation'
    },
    {
      icon: <FaTrophy className="text-4xl text-green-600" />,
      title: 'Leaderboards',
      description: 'See who\'s leading in goals, wins, and other stats.',
      link: '/leaderboard'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Track Your Football Stats</h1>
        <p className="text-xl text-gray-600 mb-8">
          Keep track of your football matches, goals, assists, and more with your friends
        </p>
        
        {isAuthenticated && user ? (
          <div>
            <p className="text-lg mb-4">
              Hello, <span className="font-semibold">{user.username}</span>! You're logged in.
            </p>
            <p className="mb-4">
              Use the navigation menu to access your matches, friends, and leaderboards.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-lg mb-4">
              Scorer is a simple app to track scores for your games with friends.
            </p>
            <p className="mb-6">
              Sign up or log in to start tracking your matches and see who's winning!
            </p>
            <button
              onClick={() => loginWithRedirect()}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300"
            >
              Get Started
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {features.map((feature, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300">
            <div className="flex flex-col items-center text-center">
              {feature.icon}
              <h3 className="text-xl font-semibold mt-4 mb-2">{feature.title}</h3>
              <p className="text-gray-600 mb-4">{feature.description}</p>
              {isAuthenticated && (
                <Link 
                  to={feature.link}
                  className="text-green-600 hover:text-green-800 font-medium"
                >
                  Go to {feature.title} →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-100 p-8 rounded-lg">
        <h2 className="text-2xl font-bold text-center mb-6">How It Works</h2>
        <ol className="space-y-4">
          <li className="flex items-start">
            <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">1</span>
            <p><strong>Register and login</strong> using your preferred social account.</p>
          </li>
          <li className="flex items-start">
            <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">2</span>
            <p><strong>Connect with friends</strong> by sending and accepting friend requests.</p>
          </li>
          <li className="flex items-start">
            <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">3</span>
            <p><strong>Record match details</strong> including location, format, goals, and assists.</p>
          </li>
          <li className="flex items-start">
            <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">4</span>
            <p><strong>Get validation</strong> from friends who played in the match.</p>
          </li>
          <li className="flex items-start">
            <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mr-4 flex-shrink-0">5</span>
            <p><strong>Track your progress</strong> and compare stats with friends on the leaderboard.</p>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default Home; 