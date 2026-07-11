<script lang="ts">
	import Modal from './Modal.svelte';
	import { ui } from '$lib/ui.svelte';
</script>

<Modal bind:open={ui.helpOpen} title="Nasıl oynanır?">
	<div class="help">
		<p>
			Her gün <strong>21 tur</strong>: karışık harflerden, <strong>tüm harfleri kullanarak</strong> geçerli
			bir Türkçe kelime bul.
		</p>
		<ul>
			<li>
				⏱️ Her tur için <strong>30 saniyen</strong> var. Süre dolarsa tur yanar, sonraki tura geçersin.
			</li>
			<li>
				🔤 Harflere dokun ya da klavyeyle yaz. Kelime tamamlanınca kendiliğinden kontrol edilir.
			</li>
			<li>
				💡 Günde <strong>3 ipucu</strong> hakkın var: ipucu, cevabın sıradaki harfini yerine koyar.
			</li>
			<li>🔀 Harfleri karıştırabilir, ⏸️ oyunu duraklatabilirsin.</li>
			<li>🌙 <strong>Rahat mod:</strong> süre yok, keyfince çöz.</li>
			<li>🟩 çözdün · 🟨 ipucuyla çözdün · ⬛ çözemedin</li>
		</ul>
		<p>
			Aynı harflerle yazılabilen <em>her</em> sözlük kelimesi kabul edilir (ör.
			<strong>eczane</strong>
			/ <strong>cenaze</strong>). Kelimeler TDK madde başlarından derlenmiştir.
		</p>
		<p class="soft">Yeni bulmaca her gece yarısı (Türkiye saati) yayınlanır.</p>
	</div>
</Modal>

<style>
	.help {
		font-size: 0.94rem;
	}

	ul {
		padding-left: 1.1rem;
		display: grid;
		gap: 0.35rem;
	}

	.soft {
		color: var(--ink-soft);
		font-size: 0.85rem;
	}
</style>
