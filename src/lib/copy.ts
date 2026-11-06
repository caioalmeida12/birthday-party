import { PARTY_NAME } from './config'
import {
  PARTY_DATE_LABEL,
  PARTY_PLACE_FULL,
  PARTY_PLACE_NAME,
  PARTY_PLACE_NOTE,
  PARTY_PLACE_REGION,
  PARTY_TIME_LABEL,
  PARTY_WEEKDAY_LABEL,
} from './partyDetails'

/** Textos do convidado — uma fonte, tom seco de mensagem, não de onboarding. */
export const copy = {
  inviteKicker: 'Convite',
  inviteTitle: `Aniversário do ${PARTY_NAME}`,
  inviteWhen: `${PARTY_WEEKDAY_LABEL}, ${PARTY_DATE_LABEL} · ${PARTY_TIME_LABEL}`,
  inviteWhere: PARTY_PLACE_NAME,
  inviteWhereNote: PARTY_PLACE_NOTE,
  inviteWhereSub: PARTY_PLACE_REGION,
  invitePlaceFull: PARTY_PLACE_FULL,
  inviteNext: 'Continuar',

  purposeTitle: 'Duas coisas pra ajudar',
  purposePhotoTitle: 'Foto',
  purposePhotoBody: 'Eu imprimo e uso na decoração da festa. Manda antes do dia.',
  purposeMusicTitle: 'Música',
  purposeMusicBody: 'Entra na fila e toca na caixa na festa. Dá pra votar nas outras também.',
  purposeNext: 'Seguir',
  purposeBack: 'Voltar',

  nameTitle: 'Como te chamam?',
  nameHint: 'Aparece do lado do que você enviar.',
  namePlaceholder: 'Nome ou apelido',
  nameError: 'Escreve seu nome ou apelido.',
  nameNext: 'Continuar',
  nameBack: 'Voltar',

  photoAskTitle: 'Foto pra decoração',
  photoAskBody:
    'Manda uma imagem pra eu imprimir e colocar na festa. Não é foto de perfil — é decoração.',
  photoAskCta: 'Escolher foto',
  photoAskLater: 'Depois',
  photoAskBack: 'Voltar',

  gateKicker: 'Oi',
  gateTitle: PARTY_NAME,
  gateBody: 'Escreve como te chamam — aparece no que você enviar.',
  gateCta: 'Entrar',

  homeKicker: 'Convite',
  homeTagline: 'Foto pra imprimir na decoração. Música pra tocar na festa.',
  homePhotoCta: 'Enviar foto',
  homePhotoHint: 'Impressão pra decoração. Antes do dia 14.',
  homeMusicCta: 'Enviar música',
  homeMusicHint: 'Toca na caixa no dia.',

  songsTitle: 'Música',
  songsLead: 'Nome ou link do Spotify/YouTube. Entra na fila da festa.',
  songsField: 'Nome ou link',
  songsFieldHint: 'Ex.: Mas que nada',
  songsSearch: 'Buscar',
  songsSearching: 'Buscando…',
  songsPickTitle: 'Qual delas?',
  songsPickLead: 'Marca a certa e envia.',
  songsPickConfirm: 'Enviar',
  songsPickConfirming: 'Enviando…',
  songsPickAgain: 'Buscar de novo',
  songsQueueTitle: 'Fila',
  songsQueueLead: 'Ordem na festa. Gostei sobe a música.',
  songsQueueEmpty: 'Nada ainda.',
  songsQueueOne: '1 na fila',
  songsQueueMany: (n: number) => `${n} na fila`,
  songsOk: 'Entrou na fila.',

  photosTitle: 'Foto',
  photosLead: (mb: number) =>
    `Vai impressa na decoração. Manda antes do dia 14. Até ${mb} MB.`,
  photosField: 'Arquivo',
  photosSubmit: 'Enviar',
  photosSubmitting: 'Enviando…',
  photosOk: 'Recebida.',
  photosListTitle: 'Recebidas',
  photosEmpty: 'Nenhuma ainda.',
} as const
