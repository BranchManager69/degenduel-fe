import React from 'react';
import SimpleAvatar, { AvatarType, AvatarColorScheme } from './SimpleAvatar';

interface SimpleAvatarExamplesProps {
  showNames?: boolean;
}

const SimpleAvatarExamples: React.FC<SimpleAvatarExamplesProps> = ({
  showNames = true,
}) => {
  // Sample usernames
  const users = [
    { name: 'cryptoking', type: 'degen' as AvatarType },
    { name: 'hodlqueen', type: 'winner' as AvatarType },
    { name: 'moonboy', type: 'trader' as AvatarType },
    { name: 'diamondhands', type: 'admin' as AvatarType },
    { name: 'whalewatcher', type: 'degen' as AvatarType },
    { name: 'paperhand', type: 'loser' as AvatarType },
    { name: 'rugpulled', type: 'loser' as AvatarType },
    { name: 'laserbull', type: 'winner' as AvatarType },
    { name: 'liquidated', type: 'loser' as AvatarType },
    { name: 'tokenmancer', type: 'admin' as AvatarType },
  ];

  // Available colors
  const colorSchemes: AvatarColorScheme[] = [
    'green', 'blue', 'purple', 'red', 'orange', 'gray'
  ];

  // Available types
  const avatarTypes: AvatarType[] = [
    'degen', 'trader', 'winner', 'loser', 'admin', 'default'
  ];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Avatar Types</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
          {avatarTypes.map((type) => (
            <div key={type} className="flex flex-col items-center">
              <SimpleAvatar 
                type={type} 
                colorScheme="purple"
                size={80}
                animate={true}
              />
              <span className="mt-2 text-center font-semibold capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Color Schemes</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
          {colorSchemes.map((color) => (
            <div key={color} className="flex flex-col items-center">
              <SimpleAvatar 
                type="default" 
                colorScheme={color}
                size={80}
                name={color}
              />
              <span className="mt-2 text-center font-semibold capitalize">{color}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Username-based Avatars</h2>
        <p className="text-sm text-gray-600 mb-4">These avatars are generated from usernames with deterministic properties</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {users.slice(0, 5).map((user) => (
            <div key={user.name} className="flex flex-col items-center">
              <SimpleAvatar 
                name={user.name} 
                size={80}
                animate={true}
                onClick={() => console.log(`Clicked on ${user.name}'s avatar`)}
              />
              {showNames && (
                <span className="mt-2 text-center text-sm overflow-hidden text-ellipsis max-w-full">
                  {user.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Typed Avatars</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
          {users.slice(5, 10).map((user) => (
            <div key={user.name} className="flex flex-col items-center">
              <SimpleAvatar 
                type={user.type}
                name={user.name} 
                size={80}
              />
              {showNames && (
                <span className="mt-2 text-center text-sm overflow-hidden text-ellipsis max-w-full">
                  {user.name}
                  <span className="block text-xs text-gray-500 capitalize">({user.type})</span>
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Different Sizes</h2>
        <div className="flex items-end justify-center gap-4">
          <div className="flex flex-col items-center">
            <SimpleAvatar size={32} name="tiny" />
            <span className="mt-2 text-xs">32px</span>
          </div>
          <div className="flex flex-col items-center">
            <SimpleAvatar size={48} name="small" />
            <span className="mt-2 text-xs">48px</span>
          </div>
          <div className="flex flex-col items-center">
            <SimpleAvatar size={64} name="medium" />
            <span className="mt-2 text-xs">64px</span>
          </div>
          <div className="flex flex-col items-center">
            <SimpleAvatar size={96} name="large" />
            <span className="mt-2 text-xs">96px</span>
          </div>
          <div className="flex flex-col items-center">
            <SimpleAvatar size={128} name="xlarge" />
            <span className="mt-2 text-xs">128px</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleAvatarExamples;