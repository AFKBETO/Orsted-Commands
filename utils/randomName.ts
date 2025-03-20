export const randName = [
    [
        'Ariel',
        'Atofe',
        'Miko',
        'Kishirika Kishirisu',
        'Ghislaine',
        'Isolde',
        'Nina',
        'Nanahoshi',
    ],
    [
        'Perugius',
        'Sieg',
        'Pax',
        'Darius',
        'Nokopara',
        'Hitogami',
        'Dark King Vita',
        'Gal Farion',
        'Luke',
        'Somal',
        'Philemon',
        'Orsted',
    ],
];

export function randomName(gender: 'any' | 'male' | 'female' = 'any') {
    const isRandomGenderMale = gender === 'any' &&
        Math.floor(Math.random() * 10) !== 0;
    const genderIndex = (isRandomGenderMale || gender === 'male') ? 1 : 0;
    return randName[genderIndex].randomItem();
}
