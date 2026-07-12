<script lang="ts">
	import Modal from './Modal.svelte';
	import Icon from './Icon.svelte';
	import { ui } from '$lib/ui.svelte';
</script>

<Modal bind:open={ui.helpOpen} title="Nasıl oynanır?">
	<div class="help">
		<p>
			Her gün <strong>21 tur</strong> oynanır. Her turda karışık harfler verilir;
			<strong>tüm harfleri kullanarak</strong> geçerli bir Türkçe kelime bulman gerekir.
		</p>
		<ul>
			<li>
				<span class="li-icon"><Icon name="clock" size={16} /></span>
				<span
					>Her tur için <strong>30 saniyen</strong> var. Süre dolarsa tur yanar, oyun sonraki turla devam
					eder.</span
				>
			</li>
			<li>
				<span class="li-icon"><Icon name="check" size={16} /></span>
				<span
					>Harflere dokun ya da klavyeyle yaz. Kelime tamamlanınca otomatik olarak kontrol edilir.</span
				>
			</li>
			<li>
				<span class="li-icon"><Icon name="bulb" size={16} /></span>
				<span
					>Günde <strong>3 ipucu</strong> hakkın var. İpucu, cevabın sıradaki harfini yerine koyar.</span
				>
			</li>
			<li>
				<span class="li-icon"><Icon name="shuffle" size={16} /></span>
				<span>Harfleri karıştırabilir, oyunu duraklatabilirsin. Duraklatınca harfler gizlenir.</span
				>
			</li>
			<li>
				<span class="li-icon"><Icon name="no-timer" size={16} /></span>
				<span
					><strong>Rahat mod:</strong> süre yok, keyfince çöz. Takıldığın turu geçebilirsin; geçilen tur
					çözülmemiş sayılır.</span
				>
			</li>
		</ul>
		<p class="legend">
			<span class="sq solved"></span> çözdün
			<span class="sq revealed"></span> ipucuyla çözdün
			<span class="sq failed"></span> çözemedin
		</p>
		<p>
			Aynı harflerle yazılabilen <em>her</em> sözlük kelimesi kabul edilir; örneğin
			<strong>elmas</strong> ve <strong>selam</strong>. Kelimeler TDK madde başlıklarından
			alınmıştır.
		</p>
		<p class="soft">Yeni bulmaca her gece yarısı Türkiye saatiyle yayınlanır.</p>
	</div>
</Modal>

<style>
	.help {
		font-size: 0.94rem;
	}

	ul {
		list-style: none;
		padding: 0;
		display: grid;
		gap: 0.45rem;
	}

	li {
		display: flex;
		gap: 0.5rem;
		align-items: baseline;
	}

	.li-icon {
		color: var(--accent);
		flex-shrink: 0;
		transform: translateY(2px);
	}

	.legend {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
		font-size: 0.88rem;
	}

	.sq {
		width: 0.95rem;
		height: 0.95rem;
		border-radius: 4px;
		display: inline-block;
	}

	.sq:not(:first-child) {
		margin-left: 0.5rem;
	}

	.sq.solved {
		background: var(--good);
	}

	.sq.revealed {
		background: var(--warn);
	}

	.sq.failed {
		background: var(--line);
	}

	.soft {
		color: var(--ink-soft);
		font-size: 0.85rem;
	}
</style>
