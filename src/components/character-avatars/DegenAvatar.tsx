import React from 'react';
import Avataaars from 'react-avataaars';
import { motion } from 'framer-motion';

export type AvatarStyle = 'Circle' | 'Transparent';
export type TopType = 
  'NoHair' | 'Eyepatch' | 'Hat' | 'Hijab' | 'Turban' | 
  'WinterHat1' | 'WinterHat2' | 'WinterHat3' | 'WinterHat4' | 
  'LongHairBigHair' | 'LongHairBob' | 'LongHairBun' | 'LongHairCurly' | 
  'LongHairCurvy' | 'LongHairDreads' | 'LongHairFrida' | 'LongHairFro' | 
  'LongHairFroBand' | 'LongHairNotTooLong' | 'LongHairShavedSides' | 
  'LongHairMiaWallace' | 'LongHairStraight' | 'LongHairStraight2' | 
  'LongHairStraightStrand' | 'ShortHairDreads01' | 'ShortHairDreads02' | 
  'ShortHairFrizzle' | 'ShortHairShaggyMullet' | 'ShortHairShortCurly' | 
  'ShortHairShortFlat' | 'ShortHairShortRound' | 'ShortHairShortWaved' | 
  'ShortHairSides' | 'ShortHairTheCaesar' | 'ShortHairTheCaesarSidePart';

export type AccessoriesType = 
  'Blank' | 'Kurt' | 'Prescription01' | 'Prescription02' | 
  'Round' | 'Sunglasses' | 'Wayfarers';

export type HairColorType = 
  'Auburn' | 'Black' | 'Blonde' | 'BlondeGolden' | 'Brown' | 
  'BrownDark' | 'PastelPink' | 'Platinum' | 'Red' | 'SilverGray';

export type FacialHairType = 
  'Blank' | 'BeardMedium' | 'BeardLight' | 'BeardMajestic' | 
  'MoustacheFancy' | 'MoustacheMagnum';

export type ClotheType = 
  'BlazerShirt' | 'BlazerSweater' | 'CollarSweater' | 'GraphicShirt' | 
  'Hoodie' | 'Overall' | 'ShirtCrewNeck' | 'ShirtScoopNeck' | 
  'ShirtVNeck';

export type EyeType = 
  'Close' | 'Cry' | 'Default' | 'Dizzy' | 'EyeRoll' | 
  'Happy' | 'Hearts' | 'Side' | 'Squint' | 'Surprised' | 
  'Wink' | 'WinkWacky';

export type EyebrowType = 
  'Angry' | 'AngryNatural' | 'Default' | 'DefaultNatural' | 
  'FlatNatural' | 'RaisedExcited' | 'RaisedExcitedNatural' | 
  'SadConcerned' | 'SadConcernedNatural' | 'UnibrowNatural' | 'UpDown' | 
  'UpDownNatural';

export type MouthType = 
  'Concerned' | 'Default' | 'Disbelief' | 'Eating' | 'Grimace' | 
  'Sad' | 'ScreamOpen' | 'Serious' | 'Smile' | 'Tongue' | 
  'Twinkle' | 'Vomit';

export type SkinColorType = 
  'Tanned' | 'Yellow' | 'Pale' | 'Light' | 'Brown' | 
  'DarkBrown' | 'Black';

export type ClotheColorType = 
  'Black' | 'Blue01' | 'Blue02' | 'Blue03' | 'Gray01' | 
  'Gray02' | 'Heather' | 'PastelBlue' | 'PastelGreen' | 
  'PastelOrange' | 'PastelRed' | 'PastelYellow' | 'Pink' | 
  'Red' | 'White';

export type GraphicType = 
  'Bat' | 'Cumbia' | 'Deer' | 'Diamond' | 'Hola' | 
  'Pizza' | 'Resist' | 'Selena' | 'Bear' | 'SkullOutline' | 
  'Skull';

interface DegenAvatarProps {
  // Avatar options
  avatarStyle?: AvatarStyle;
  topType?: TopType;
  accessoriesType?: AccessoriesType;
  hairColor?: HairColorType;
  facialHairType?: FacialHairType;
  clotheType?: ClotheType;
  clotheColor?: ClotheColorType;
  eyeType?: EyeType;
  eyebrowType?: EyebrowType;
  mouthType?: MouthType;
  skinColor?: SkinColorType;
  graphicType?: GraphicType;
  
  // Sizing and animation
  size?: string | number;
  animate?: boolean;
  username?: string; // For deterministic generation
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

// Utility to generate deterministic options based on a username
const generateDeterministicOptions = (username: string): Partial<DegenAvatarProps> => {
  // Create a simple hash from the username
  const hash = username.split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Arrays of possible values for each option
  const topTypes: TopType[] = [
    'NoHair', 'Eyepatch', 'Hat', 'WinterHat1', 'WinterHat4', 
    'LongHairBigHair', 'LongHairBob', 'LongHairBun', 'LongHairFro',
    'ShortHairDreads01', 'ShortHairShortFlat', 'ShortHairSides'
  ];
  
  const accessoriesTypes: AccessoriesType[] = [
    'Blank', 'Kurt', 'Prescription01', 'Round', 'Sunglasses', 'Wayfarers'
  ];
  
  const hairColors: HairColorType[] = [
    'Auburn', 'Black', 'Blonde', 'Brown', 'PastelPink', 'Red', 'SilverGray'
  ];
  
  const facialHairTypes: FacialHairType[] = [
    'Blank', 'BeardMedium', 'BeardLight', 'MoustacheFancy'
  ];
  
  const clotheTypes: ClotheType[] = [
    'BlazerShirt', 'GraphicShirt', 'Hoodie', 'ShirtCrewNeck', 'ShirtVNeck'
  ];
  
  const eyeTypes: EyeType[] = [
    'Default', 'Happy', 'Side', 'Squint', 'Wink'
  ];
  
  const eyebrowTypes: EyebrowType[] = [
    'Default', 'RaisedExcited', 'SadConcerned', 'UpDown'
  ];
  
  const mouthTypes: MouthType[] = [
    'Default', 'Smile', 'Serious', 'Twinkle'
  ];
  
  const skinColors: SkinColorType[] = [
    'Tanned', 'Yellow', 'Pale', 'Light', 'Brown', 'DarkBrown'
  ];
  
  const clotheColors: ClotheColorType[] = [
    'Black', 'Blue01', 'Blue02', 'Gray01', 'Heather', 'PastelBlue', 
    'PastelGreen', 'PastelRed', 'Pink', 'Red'
  ];
  
  const graphicTypes: GraphicType[] = [
    'Bat', 'Diamond', 'Resist', 'SkullOutline', 'Skull'
  ];
  
  // Use the hash to deterministically select values
  return {
    topType: topTypes[hash % topTypes.length],
    accessoriesType: accessoriesTypes[(hash + 1) % accessoriesTypes.length],
    hairColor: hairColors[(hash + 2) % hairColors.length],
    facialHairType: facialHairTypes[(hash + 3) % facialHairTypes.length],
    clotheType: clotheTypes[(hash + 4) % clotheTypes.length],
    eyeType: eyeTypes[(hash + 5) % eyeTypes.length],
    eyebrowType: eyebrowTypes[(hash + 6) % eyebrowTypes.length],
    mouthType: mouthTypes[(hash + 7) % mouthTypes.length],
    skinColor: skinColors[(hash + 8) % skinColors.length],
    clotheColor: clotheColors[(hash + 9) % clotheColors.length],
    graphicType: graphicTypes[(hash + 10) % graphicTypes.length],
  };
};

// Predefined types for different character roles
export const AVATAR_TYPES = {
  DEGEN: {
    topType: 'WinterHat4',
    accessoriesType: 'Sunglasses',
    facialHairType: 'BeardMedium',
    clotheType: 'GraphicShirt',
    clotheColor: 'Black',
    graphicType: 'Skull',
    eyeType: 'Squint',
    eyebrowType: 'RaisedExcited',
    mouthType: 'Twinkle',
    skinColor: 'Light',
  },
  TRADER: {
    topType: 'ShortHairShortFlat',
    accessoriesType: 'Prescription01',
    facialHairType: 'Blank',
    clotheType: 'BlazerShirt',
    clotheColor: 'Blue01',
    eyeType: 'Happy',
    eyebrowType: 'Default',
    mouthType: 'Smile',
    skinColor: 'Pale',
  },
  WINNER: {
    topType: 'LongHairBigHair',
    accessoriesType: 'Sunglasses',
    facialHairType: 'Blank',
    clotheType: 'BlazerSweater',
    clotheColor: 'PastelGreen',
    eyeType: 'Hearts',
    eyebrowType: 'RaisedExcitedNatural',
    mouthType: 'Smile',
    skinColor: 'Tanned',
  },
  LOSER: {
    topType: 'ShortHairDreads01',
    accessoriesType: 'Blank',
    facialHairType: 'BeardLight',
    clotheType: 'ShirtCrewNeck',
    clotheColor: 'Gray01',
    eyeType: 'Sad',
    eyebrowType: 'SadConcerned',
    mouthType: 'Sad',
    skinColor: 'Pale',
  },
  ADMIN: {
    topType: 'LongHairFroBand',
    accessoriesType: 'Kurt',
    facialHairType: 'MoustacheFancy',
    clotheType: 'CollarSweater',
    clotheColor: 'Red',
    eyeType: 'Side',
    eyebrowType: 'RaisedExcited',
    mouthType: 'Serious',
    skinColor: 'Brown',
  },
};

export type AvatarType = keyof typeof AVATAR_TYPES;

const DegenAvatar: React.FC<DegenAvatarProps> = ({
  avatarStyle = 'Circle',
  topType,
  accessoriesType,
  hairColor,
  facialHairType,
  clotheType,
  clotheColor,
  eyeType,
  eyebrowType,
  mouthType,
  skinColor,
  graphicType,
  size = '100px',
  animate = false,
  username,
  onClick,
  className = '',
  style = {},
}) => {
  // If username is provided, generate deterministic options
  const generatedOptions = username ? generateDeterministicOptions(username) : {};
  
  // Combine props with generated options, prioritizing explicitly provided props
  const finalOptions = {
    ...generatedOptions,
    topType: topType || generatedOptions.topType || 'ShortHairShortFlat',
    accessoriesType: accessoriesType || generatedOptions.accessoriesType || 'Blank',
    hairColor: hairColor || generatedOptions.hairColor || 'Brown',
    facialHairType: facialHairType || generatedOptions.facialHairType || 'Blank',
    clotheType: clotheType || generatedOptions.clotheType || 'BlazerShirt',
    clotheColor: clotheColor || generatedOptions.clotheColor || 'Black',
    eyeType: eyeType || generatedOptions.eyeType || 'Default',
    eyebrowType: eyebrowType || generatedOptions.eyebrowType || 'Default',
    mouthType: mouthType || generatedOptions.mouthType || 'Default',
    skinColor: skinColor || generatedOptions.skinColor || 'Light',
    graphicType: graphicType || generatedOptions.graphicType || 'Diamond',
  };

  // Optional animation
  const animationProps = animate ? {
    animate: { 
      y: [0, -5, 0],
      rotate: [0, 2, 0, -2, 0],
    },
    transition: { 
      duration: 5, 
      repeat: Infinity,
      repeatType: "mirror" as const,
    }
  } : {};

  return (
    <motion.div 
      className={`degen-avatar ${className}`}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
      {...animationProps}
    >
      <Avataaars
        avatarStyle={avatarStyle}
        topType={finalOptions.topType}
        accessoriesType={finalOptions.accessoriesType}
        hairColor={finalOptions.hairColor}
        facialHairType={finalOptions.facialHairType}
        clotheType={finalOptions.clotheType}
        clotheColor={finalOptions.clotheColor}
        eyeType={finalOptions.eyeType}
        eyebrowType={finalOptions.eyebrowType}
        mouthType={finalOptions.mouthType}
        skinColor={finalOptions.skinColor}
        graphicType={finalOptions.graphicType}
        style={{ width: size, height: size }}
      />
    </motion.div>
  );
};

export default DegenAvatar;