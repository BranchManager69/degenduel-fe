import React from 'react';
import DegenAvatar, { AVATAR_TYPES, AvatarType } from './DegenAvatar';

interface AvatarExamplesProps {
  showUsernames?: boolean;
}

const AvatarExamples: React.FC<AvatarExamplesProps> = ({ 
  showUsernames = true 
}) => {
  // Example usernames
  const usernames = [
    'cryptoking',
    'hodlqueen',
    'moonboy',
    'diamondhands',
    'whalewatcher',
    'paperhand',
    'rugpulled',
    'laserbull',
    'liquidated',
    'tokenmancer'
  ];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Predefined Character Types</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {(Object.keys(AVATAR_TYPES) as AvatarType[]).map((type) => (
            <div key={type} className="flex flex-col items-center">
              <DegenAvatar 
                {...AVATAR_TYPES[type] as any} 
                size="100px"
                animate={true}
              />
              <span className="mt-2 text-center font-semibold">{type}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Username-based Avatars</h2>
        <p className="text-sm text-gray-600 mb-4">These avatars are generated deterministically from usernames</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {usernames.map((username) => (
            <div key={username} className="flex flex-col items-center">
              <DegenAvatar 
                username={username} 
                size="100px"
                animate={false}
                onClick={() => console.log(`Clicked on ${username}'s avatar`)}
              />
              {showUsernames && (
                <span className="mt-2 text-center text-sm overflow-hidden text-ellipsis max-w-full">
                  {username}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Random Custom Avatars</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div className="flex flex-col items-center">
            <DegenAvatar 
              topType="WinterHat3"
              accessoriesType="Prescription02"
              hairColor="Black"
              facialHairType="BeardMajestic"
              clotheType="Hoodie"
              clotheColor="PastelRed"
              eyeType="Happy"
              eyebrowType="Angry"
              mouthType="Smile"
              skinColor="Brown"
              size="100px"
            />
            <span className="mt-2 text-center font-semibold">Crypto Hipster</span>
          </div>

          <div className="flex flex-col items-center">
            <DegenAvatar 
              topType="LongHairCurly"
              accessoriesType="Round"
              hairColor="Red"
              facialHairType="Blank"
              clotheType="GraphicShirt"
              clotheColor="Blue03"
              graphicType="Deer"
              eyeType="Surprised"
              eyebrowType="RaisedExcited"
              mouthType="Twinkle"
              skinColor="Pale"
              size="100px"
            />
            <span className="mt-2 text-center font-semibold">Gem Hunter</span>
          </div>

          <div className="flex flex-col items-center">
            <DegenAvatar 
              topType="ShortHairTheCaesar"
              accessoriesType="Kurt"
              hairColor="BrownDark"
              facialHairType="MoustacheFancy"
              clotheType="BlazerSweater"
              clotheColor="Black"
              eyeType="Side"
              eyebrowType="UpDown"
              mouthType="Serious"
              skinColor="Tanned"
              size="100px"
            />
            <span className="mt-2 text-center font-semibold">VC Analyst</span>
          </div>

          <div className="flex flex-col items-center">
            <DegenAvatar 
              topType="LongHairNotTooLong"
              accessoriesType="Sunglasses"
              hairColor="Blonde"
              facialHairType="Blank"
              clotheType="ShirtVNeck"
              clotheColor="PastelBlue"
              eyeType="Wink"
              eyebrowType="RaisedExcitedNatural"
              mouthType="Smile"
              skinColor="Light"
              size="100px"
            />
            <span className="mt-2 text-center font-semibold">Influencer</span>
          </div>

          <div className="flex flex-col items-center">
            <DegenAvatar 
              topType="Eyepatch"
              accessoriesType="Blank"
              hairColor="SilverGray"
              facialHairType="BeardLight"
              clotheType="BlazerShirt"
              clotheColor="Gray02"
              eyeType="Squint"
              eyebrowType="AngryNatural"
              mouthType="Grimace"
              skinColor="DarkBrown"
              size="100px"
            />
            <span className="mt-2 text-center font-semibold">Whale</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarExamples;