import cafeInterior from '../assets/photos/cafe-interior.jpg'
import grainBowl from '../assets/photos/grain-bowl.jpg'
import harvestBowl from '../assets/photos/harvest-bowl.jpg'
import pineappleSmoothies from '../assets/photos/pineapple-smoothies.jpg'
import saladBowls from '../assets/photos/salad-bowls.jpg'
import streetCorn from '../assets/photos/street-corn.jpg'

/** A photo in the brand's Asset library. */
export interface LibraryPhoto {
  src: string
  alt: string
}

/**
 * What the composer's Add tile and "Asset library" offer. Plan › Asset library
 * has no screen yet, so this handful of the brand's photos stands in for it.
 */
export const libraryPhotos: LibraryPhoto[] = [
  { src: streetCorn, alt: 'Grilled street corn with lime on a plate' },
  { src: saladBowls, alt: 'Four salad bowls on a table, from above' },
  { src: grainBowl, alt: 'A grain bowl with roasted vegetables' },
  { src: harvestBowl, alt: 'A harvest bowl with squash and greens' },
  { src: pineappleSmoothies, alt: 'Two pineapple smoothies with straws' },
  { src: cafeInterior, alt: 'The café, empty, in morning light' },
]
