import React from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const Contact: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-100">Contact Us</h1>
        <p className="mt-4 text-gray-400">
          Have questions or need support? We're here to help!
        </p>
      </div>

      <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
        <CardContent className="p-6">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300">Email</label>
              <input
                type="email"
                className="mt-1 block w-full rounded-md bg-dark-300 border-dark-400 text-gray-100"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Subject</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md bg-dark-300 border-dark-400 text-gray-100"
                placeholder="How can we help?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300">Message</label>
              <textarea
                rows={4}
                className="mt-1 block w-full rounded-md bg-dark-300 border-dark-400 text-gray-100"
                placeholder="Your message..."
              />
            </div>
            <Button variant="gradient" className="w-full">
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-gray-400">
        <p>You can also reach us at:</p>
        <p className="mt-2">
          <a href="mailto:support@degenduel.com" className="text-brand-400 hover:text-brand-300">
            support@degenduel.com
          </a>
        </p>
      </div>
    </div>
  );
};