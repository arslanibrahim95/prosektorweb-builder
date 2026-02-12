import { Font } from '@react-pdf/renderer'

// Türkçe karakter desteği için Roboto fontunu kaydediyoruz
// CDN üzerinden yüklüyoruz ki ekstra dosya boyutu olmasın
export const registerFonts = () => {
    Font.register({
        family: 'Roboto',
        fonts: [
            {
                src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
                fontWeight: 300,
            },
            {
                src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
                fontWeight: 400,
            },
            {
                src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf',
                fontWeight: 500,
            },
            {
                src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
                fontWeight: 700,
            },
        ],
    })
}
