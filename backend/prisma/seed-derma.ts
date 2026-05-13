const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const dermatologicalCodes = [
  { code: 'L700', description: 'Acné vulgar' },
  { code: 'L209', description: 'Dermatitis atópica, no especificada' },
  { code: 'L80', description: 'Vitíligo' },
  { code: 'L400', description: 'Psoriasis vulgar' },
  { code: 'L732', description: 'Hidradenitis supurativa' },
  { code: 'L219', description: 'Dermatitis seborreica, no especificada' },
  { code: 'B019', description: 'Varicela sin complicaciones' },
  { code: 'B029', description: 'Herpes zoster sin complicaciones' },
  { code: 'B009', description: 'Infección herpética, no especificada' },
  { code: 'L509', description: 'Urticaria, no especificada' },
  { code: 'L010', description: 'Impétigo [cualquier sitio]' },
  { code: 'B07', description: 'Verrugas víricas' },
  { code: 'L309', description: 'Dermatitis, no especificada' },
  { code: 'L719', description: 'Rosácea, no especificada' },
  { code: 'L600', description: 'Uña encarnada' },
  { code: 'B351', description: 'Tiña de las uñas' },
  { code: 'B350', description: 'Tiña de la barba y del cuero cabelludo' },
  { code: 'B353', description: 'Tiña del pie [tinea pedis]' },
  { code: 'B354', description: 'Tiña del cuerpo [tinea corporis]' },
  { code: 'B359', description: 'Dermatofitosis, no especificada' },
  { code: 'B86', description: 'Escabiosis' },
  { code: 'B850', description: 'Pediculosis debida a Pediculus humanus capitis' },
  { code: 'L039', description: 'Celulitis, no especificada' },
  { code: 'L029', description: 'Absceso cutáneo, furúnculo y ántrax, no especificado' },
  { code: 'L100', description: 'Pénfigo vulgar' },
  { code: 'L120', description: 'Penfigoide ampolloso' },
  { code: 'L439', description: 'Liquen plano, no especificado' },
  { code: 'L984', description: 'Úlcera crónica de la piel, no clasificada en otra parte' },
  { code: 'L82', description: 'Queratosis seborreica' },
  { code: 'L850', description: 'Ictiosis adquirida' },
  { code: 'L810', description: 'Hiperpigmentación postinflamatoria' },
  { code: 'L811', description: 'Cloasma' },
  { code: 'L815', description: 'Leucodermia, no clasificada en otra parte' },
  { code: 'L83', description: 'Acantosis nigricans' },
  { code: 'L900', description: 'Líquen escleroso y atrófico' },
  { code: 'L910', description: 'Cicatriz queloide' },
  { code: 'L930', description: 'Lupus eritematoso discoide' },
  { code: 'L299', description: 'Prurito, no especificado' },
  { code: 'L300', description: 'Dermatitis numular' },
  { code: 'L301', description: 'Dishidrosis [pomfólix]' },
  { code: 'L305', description: 'Pitiriasis alba' },
  { code: 'L42', description: 'Pitiriasis rosada' },
  { code: 'L661', description: 'Liquen planopilar' },
  { code: 'L639', description: 'Alopecia areata, no especificada' },
  { code: 'L649', description: 'Alopecia androgénica, no especificada' },
  { code: 'L659', description: 'Pérdida no especificada del pelo' },
  { code: 'D229', description: 'Nevo melanocítico, no especificado' },
  { code: 'C439', description: 'Melanoma maligno de piel, sitio no especificado' },
  { code: 'C449', description: 'Tumor maligno de la piel, sitio no especificado' },
  { code: 'Z128', description: 'Examen de pesquisa especial para tumores de otros sitios' },
];

async function main() {
  console.log('Seeding Dermatological CIE-10 codes...');
  
  for (const item of dermatologicalCodes) {
    await prisma.cie10_catalog.upsert({
      where: { code: item.code },
      update: { description: item.description, is_custom: false },
      create: {
        code: item.code,
        description: item.description,
        is_custom: false,
      },
    });
  }
  
  console.log('Successfully seeded 50 dermatological CIE-10 codes.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
