import { Alert, Linking } from 'react-native';

// Yasal metinlerin tek kaynağı. Daha önce URL'ler üç ayrı ekranda
// elle yazılıydı; alan adı taşındığında biri unutulur ve mağaza
// incelemecisinin tıkladığı bağlantı ölü kalırdı.
export const PRIVACY_URL = 'https://elektron666.github.io/genctetsiad/gizlilik-politikasi.html';
export const TERMS_URL   = 'https://elektron666.github.io/genctetsiad/kullanim-kosullari.html';

/**
 * Dış bağlantıyı açar. Açılamazsa kullanıcıya adresi gösterir —
 * eskiden `Linking.openURL` sessizce reddediliyor, dokunmaya
 * hiçbir tepki gelmiyordu.
 */
export async function openExternal(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Bağlantı açılamadı', `Adresi tarayıcınıza yapıştırabilirsiniz:\n\n${url}`);
  }
}

/**
 * Telefon araması. `Linking.openURL` yakalanmadığında, çeviricisi
 * olmayan cihazda (tablet, bazı Android sürümleri) yakalanmamış
 * promise reddi oluşuyordu.
 */
export async function openTel(phone: string) {
  const n = phone.replace(/[^\d+]/g, '');
  if (!n || n === '—') return;
  try {
    await Linking.openURL(`tel:${n}`);
  } catch {
    Alert.alert('Arama başlatılamadı', `Numarayı elle çevirebilirsiniz:\n\n${phone}`);
  }
}

/** E-posta. Posta uygulaması yoksa adresi gösterir. */
export async function openMail(address: string) {
  if (!address) return;
  try {
    await Linking.openURL(`mailto:${address}`);
  } catch {
    Alert.alert('E-posta açılamadı', `Adresi kopyalayabilirsiniz:\n\n${address}`);
  }
}
