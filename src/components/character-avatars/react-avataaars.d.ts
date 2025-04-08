declare module 'react-avataaars' {
  import * as React from 'react';

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

  export interface AvataaarsProps {
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
    style?: React.CSSProperties;
  }

  const Avataaars: React.FC<AvataaarsProps>;
  export default Avataaars;
}