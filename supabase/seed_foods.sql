-- Seed foods table from Carnet de Bord KMDC
-- Run this in Supabase SQL Editor
-- ig = NULL means no carbs (proteins, fats, spices)

-- Schema adjustments
ALTER TABLE foods ALTER COLUMN ig DROP NOT NULL;

-- Clear existing data
TRUNCATE TABLE foods CASCADE;

-- ============================================================
-- LISTE VERTE — IG < 20
-- ============================================================

-- Légumes
INSERT INTO foods (nom, ig, liste) VALUES
  ('Artichaut', 20, 'verte'),
  ('Asperges', 15, 'verte'),
  ('Aubergine', 20, 'verte'),
  ('Blettes', 1, 'verte'),
  ('Brocoli', 1, 'verte'),
  ('Carottes crues', 16, 'verte'),
  ('Céleri branche', 15, 'verte'),
  ('Céleri rave', 15, 'verte'),
  ('Champignons', 15, 'verte'),
  ('Chicorée', 15, 'verte'),
  ('Chou-fleur', 15, 'verte'),
  ('Choucroute', 15, 'verte'),
  ('Chou blanc', 15, 'verte'),
  ('Chou rouge', 15, 'verte'),
  ('Chou vert', 15, 'verte'),
  ('Chou frisé', 15, 'verte'),
  ('Choux de Bruxelles', 15, 'verte'),
  ('Cœur de palmier', 20, 'verte'),
  ('Concombre', 15, 'verte'),
  ('Cornichon', 15, 'verte'),
  ('Courge crue', 15, 'verte'),
  ('Courgette', 15, 'verte'),
  ('Cresson', 15, 'verte'),
  ('Échalote', 15, 'verte'),
  ('Endive', 15, 'verte'),
  ('Épinard', 15, 'verte'),
  ('Fenouil', 15, 'verte'),
  ('Frisée', 15, 'verte'),
  ('Pois mange-tout', 15, 'verte'),
  ('Haricots verts', 15, 'verte'),
  ('Haricots beurre', 15, 'verte'),
  ('Haricots blancs crus', 15, 'verte'),
  ('Laitue', 15, 'verte'),
  ('Laitue romaine', 15, 'verte'),
  ('Macédoine de légumes', 15, 'verte'),
  ('Mâche', 15, 'verte'),
  ('Pâtisson', 15, 'verte'),
  ('Poireaux', 15, 'verte'),
  ('Poivrons', 15, 'verte'),
  ('Pousses de bambou', 15, 'verte'),
  ('Radis', 15, 'verte'),
  ('Ratatouille maison', 20, 'verte'),
  ('Roquette', 15, 'verte'),
  ('Salsifis', 15, 'verte'),
  ('Scarole', 15, 'verte'),
  ('Tomate crue', 15, 'verte');

-- Fruits
INSERT INTO foods (nom, ig, liste) VALUES
  ('Cassis', 15, 'verte'),
  ('Citron', 20, 'verte'),
  ('Jus de citron sans sucre', 15, 'verte'),
  ('Rhubarbe', 15, 'verte');

-- Poisson & Crustacés (pas de glucides)
INSERT INTO foods (nom, ig, liste) VALUES
  ('Aiglefin', NULL, 'verte'),
  ('Anchois', NULL, 'verte'),
  ('Anguille', NULL, 'verte'),
  ('Araignée de mer', NULL, 'verte'),
  ('Bar', NULL, 'verte'),
  ('Bigorneau', NULL, 'verte'),
  ('Brochet', NULL, 'verte'),
  ('Calmar', NULL, 'verte'),
  ('Carpe', NULL, 'verte'),
  ('Colin', NULL, 'verte'),
  ('Crabe', NULL, 'verte'),
  ('Crevette', NULL, 'verte'),
  ('Écrevisse', NULL, 'verte'),
  ('Espadon', NULL, 'verte'),
  ('Esturgeon', NULL, 'verte'),
  ('Flétan', NULL, 'verte'),
  ('Hareng', NULL, 'verte'),
  ('Homard', NULL, 'verte'),
  ('Huître', NULL, 'verte'),
  ('Langouste', NULL, 'verte'),
  ('Loup de mer', NULL, 'verte'),
  ('Maquereau', NULL, 'verte'),
  ('Merlan', NULL, 'verte'),
  ('Mérou', NULL, 'verte'),
  ('Morue', NULL, 'verte'),
  ('Moule', NULL, 'verte'),
  ('Mulet', NULL, 'verte'),
  ('Noix de Saint-Jacques', NULL, 'verte'),
  ('Palourde', NULL, 'verte'),
  ('Poulpe', NULL, 'verte'),
  ('Sardine', NULL, 'verte'),
  ('Saumon', NULL, 'verte'),
  ('Seiche', NULL, 'verte'),
  ('Sole', NULL, 'verte'),
  ('Surimi', NULL, 'verte'),
  ('Thon', NULL, 'verte'),
  ('Truite', NULL, 'verte'),
  ('Turbot', NULL, 'verte');

-- Viande
INSERT INTO foods (nom, ig, liste) VALUES
  ('Agneau', NULL, 'verte'),
  ('Autruche', NULL, 'verte'),
  ('Bacon', NULL, 'verte'),
  ('Bœuf', NULL, 'verte'),
  ('Boudin', NULL, 'verte'),
  ('Caille', NULL, 'verte'),
  ('Canard', NULL, 'verte'),
  ('Cervelas', NULL, 'verte'),
  ('Chapon', NULL, 'verte'),
  ('Cheval', NULL, 'verte'),
  ('Chevreuil', NULL, 'verte'),
  ('Chipolata', NULL, 'verte'),
  ('Chorizo', NULL, 'verte'),
  ('Corned beef', NULL, 'verte'),
  ('Dinde', NULL, 'verte'),
  ('Escargot', NULL, 'verte'),
  ('Faisan', NULL, 'verte'),
  ('Foie gras', NULL, 'verte'),
  ('Grenouille', NULL, 'verte'),
  ('Jambon', NULL, 'verte'),
  ('Lapin', NULL, 'verte'),
  ('Lièvre', NULL, 'verte'),
  ('Merguez', NULL, 'verte'),
  ('Mortadelle', NULL, 'verte'),
  ('Oie', NULL, 'verte'),
  ('Pastrami', NULL, 'verte'),
  ('Pintade', NULL, 'verte'),
  ('Porc', NULL, 'verte'),
  ('Poulet', NULL, 'verte'),
  ('Rillettes', NULL, 'verte'),
  ('Salami', NULL, 'verte'),
  ('Sanglier', NULL, 'verte'),
  ('Saucisse', NULL, 'verte'),
  ('Saucisson', NULL, 'verte'),
  ('Veau', NULL, 'verte'),
  ('Viande de grison', NULL, 'verte');

-- Œufs
INSERT INTO foods (nom, ig, liste) VALUES
  ('Œuf', NULL, 'verte'),
  ('Œuf de caille', NULL, 'verte');

-- Matières grasses & sauces
INSERT INTO foods (nom, ig, liste) VALUES
  ('Avocat', NULL, 'verte'),
  ('Beurre', NULL, 'verte'),
  ('Crème fraîche', NULL, 'verte'),
  ('Huile d''olive', NULL, 'verte'),
  ('Huile de colza', NULL, 'verte'),
  ('Huile de noix', NULL, 'verte'),
  ('Huile de tournesol', NULL, 'verte'),
  ('Huile de coco', NULL, 'verte'),
  ('Margarine', NULL, 'verte'),
  ('Mayonnaise', NULL, 'verte'),
  ('Olives', 15, 'verte'),
  ('Sauce soja sans sucre', 15, 'verte'),
  ('Saindoux', NULL, 'verte');

-- Fromages
INSERT INTO foods (nom, ig, liste) VALUES
  ('Brie', NULL, 'verte'),
  ('Camembert', NULL, 'verte'),
  ('Cantal', NULL, 'verte'),
  ('Chèvre', NULL, 'verte'),
  ('Comté', NULL, 'verte'),
  ('Coulommiers', NULL, 'verte'),
  ('Edam', NULL, 'verte'),
  ('Emmental', NULL, 'verte'),
  ('Feta', NULL, 'verte'),
  ('Fromage bleu', NULL, 'verte'),
  ('Fromage de chèvre', NULL, 'verte'),
  ('Gouda', NULL, 'verte'),
  ('Gruyère', NULL, 'verte'),
  ('Mozzarella', NULL, 'verte'),
  ('Munster', NULL, 'verte'),
  ('Parmesan', NULL, 'verte'),
  ('Port-Salut', NULL, 'verte'),
  ('Raclette', NULL, 'verte'),
  ('Reblochon', NULL, 'verte'),
  ('Ricotta', NULL, 'verte'),
  ('Roquefort', NULL, 'verte'),
  ('Saint-Nectaire', NULL, 'verte'),
  ('Tomme', NULL, 'verte');

-- Fruits oléagineux
INSERT INTO foods (nom, ig, liste) VALUES
  ('Amandes', 20, 'verte'),
  ('Cacahuètes', 14, 'verte'),
  ('Noisettes', 20, 'verte'),
  ('Noix', 15, 'verte'),
  ('Noix de cajou', 15, 'verte'),
  ('Noix de pécan', 10, 'verte'),
  ('Noix du Brésil', 15, 'verte'),
  ('Noix de macadamia', 15, 'verte'),
  ('Pignons de pin', 15, 'verte'),
  ('Pistaches', 15, 'verte');

-- Légumineuses & Soja
INSERT INTO foods (nom, ig, liste) VALUES
  ('Tofu', 15, 'verte'),
  ('Yaourt au soja nature', 20, 'verte'),
  ('Fèves de soja', 15, 'verte'),
  ('Graines germées', 15, 'verte'),
  ('Soja cuisine', 20, 'verte'),
  ('Sauce tamari sans sucre', 15, 'verte');

-- Céréales & dérivés
INSERT INTO foods (nom, ig, liste) VALUES
  ('Son de blé', 15, 'verte'),
  ('Son d''avoine', 15, 'verte'),
  ('Germe de blé', 15, 'verte');

-- Aromates & épices
INSERT INTO foods (nom, ig, liste) VALUES
  ('Ail', NULL, 'verte'),
  ('Basilic', NULL, 'verte'),
  ('Cannelle', NULL, 'verte'),
  ('Câpres', NULL, 'verte'),
  ('Ciboulette', 15, 'verte'),
  ('Coriandre', NULL, 'verte'),
  ('Cumin', NULL, 'verte'),
  ('Curcuma', NULL, 'verte'),
  ('Estragon', NULL, 'verte'),
  ('Fenugrec', NULL, 'verte'),
  ('Gingembre', NULL, 'verte'),
  ('Laurier', NULL, 'verte'),
  ('Menthe', NULL, 'verte'),
  ('Moutarde', NULL, 'verte'),
  ('Muscade', NULL, 'verte'),
  ('Oignon', 15, 'verte'),
  ('Origan', NULL, 'verte'),
  ('Paprika', NULL, 'verte'),
  ('Persil', NULL, 'verte'),
  ('Piment', NULL, 'verte'),
  ('Poivre', NULL, 'verte'),
  ('Romarin', NULL, 'verte'),
  ('Safran', NULL, 'verte'),
  ('Sauge', NULL, 'verte'),
  ('Thym', NULL, 'verte'),
  ('Vanille', NULL, 'verte'),
  ('Vinaigre', NULL, 'verte');

-- Boissons
INSERT INTO foods (nom, ig, liste) VALUES
  ('Café', NULL, 'verte'),
  ('Eau', NULL, 'verte'),
  ('Thé', NULL, 'verte'),
  ('Tisane', NULL, 'verte'),
  ('Eau gazeuse', NULL, 'verte');

-- Sucreries à IG très bas
INSERT INTO foods (nom, ig, liste) VALUES
  ('Chocolat noir > 85% cacao', NULL, 'verte'),
  ('Fructose', 15, 'verte'),
  ('Sirop d''agave', 19, 'verte');

-- ============================================================
-- LISTE JAUNE — 20 < IG < 55
-- ============================================================

-- Fruits
INSERT INTO foods (nom, ig, liste) VALUES
  ('Abricot frais', 30, 'jaune'),
  ('Abricot sec', 35, 'jaune'),
  ('Banane (pas trop mûre)', 52, 'jaune'),
  ('Cerise', 25, 'jaune'),
  ('Clémentine', 30, 'jaune'),
  ('Coing', 35, 'jaune'),
  ('Datte fraîche', 42, 'jaune'),
  ('Figue fraîche', 30, 'jaune'),
  ('Figue sèche', 35, 'jaune'),
  ('Fraise', 25, 'jaune'),
  ('Framboise', 25, 'jaune'),
  ('Groseille', 25, 'jaune'),
  ('Kiwi', 53, 'jaune'),
  ('Mandarine', 30, 'jaune'),
  ('Mangue', 51, 'jaune'),
  ('Mûre', 25, 'jaune'),
  ('Myrtille', 25, 'jaune'),
  ('Nectarine', 35, 'jaune'),
  ('Noix de coco', 35, 'jaune'),
  ('Orange', 38, 'jaune'),
  ('Pamplemousse', 28, 'jaune'),
  ('Pêche', 35, 'jaune'),
  ('Poire', 34, 'jaune'),
  ('Pomme', 35, 'jaune'),
  ('Pruneau', 35, 'jaune'),
  ('Prune', 30, 'jaune'),
  ('Raisin', 53, 'jaune');

-- Jus de fruits
INSERT INTO foods (nom, ig, liste) VALUES
  ('Jus d''orange', 50, 'jaune'),
  ('Jus d''ananas', 46, 'jaune'),
  ('Jus de carotte', 43, 'jaune'),
  ('Jus de pomme', 44, 'jaune'),
  ('Jus de pamplemousse', 48, 'jaune'),
  ('Jus de pruneau', 43, 'jaune'),
  ('Jus de tomate', 38, 'jaune');

-- Légumes
INSERT INTO foods (nom, ig, liste) VALUES
  ('Betterave crue', 30, 'jaune'),
  ('Carotte cuite', 47, 'jaune'),
  ('Maïs doux', 54, 'jaune'),
  ('Navet cru', 30, 'jaune'),
  ('Sauce tomate sans sucre', 35, 'jaune'),
  ('Topinambour cuit', 53, 'jaune');

-- Légumineuses
INSERT INTO foods (nom, ig, liste) VALUES
  ('Flageolets', 25, 'jaune'),
  ('Haricots blancs cuits', 32, 'jaune'),
  ('Haricots rouges cuits', 35, 'jaune'),
  ('Lentilles corail', 26, 'jaune'),
  ('Lentilles vertes', 48, 'jaune'),
  ('Petits pois cuits', 38, 'jaune'),
  ('Pois cassés', 32, 'jaune'),
  ('Pois chiches', 32, 'jaune');

-- Laits végétaux
INSERT INTO foods (nom, ig, liste) VALUES
  ('Lait de soja', 34, 'jaune'),
  ('Lait d''avoine', 30, 'jaune'),
  ('Lait d''amandes', 25, 'jaune');

-- Pomme de terre
INSERT INTO foods (nom, ig, liste) VALUES
  ('Patate douce cuite', 46, 'jaune');

-- Céréales & pâtes
INSERT INTO foods (nom, ig, liste) VALUES
  ('Boulgour', 45, 'jaune'),
  ('Flocons d''avoine', 55, 'jaune'),
  ('Macaroni', 47, 'jaune'),
  ('Pâtes sèches al dente', 49, 'jaune'),
  ('Pâtes complètes', 48, 'jaune'),
  ('Quinoa', 35, 'jaune'),
  ('Riz brun', 52, 'jaune'),
  ('Riz complet', 50, 'jaune'),
  ('Spaghettis al dente', 49, 'jaune'),
  ('Vermicelles', 35, 'jaune'),
  ('Wasa fibres', 35, 'jaune');

-- Pain
INSERT INTO foods (nom, ig, liste) VALUES
  ('Pain de seigle au levain', 40, 'jaune'),
  ('Pain intégral', 49, 'jaune'),
  ('Pain au son d''avoine', 40, 'jaune'),
  ('Pumpernickel (pain noir)', 50, 'jaune');

-- Produits laitiers
INSERT INTO foods (nom, ig, liste) VALUES
  ('Lait entier', 39, 'jaune'),
  ('Lait écrémé', 37, 'jaune'),
  ('Fromage blanc', 30, 'jaune'),
  ('Yaourt nature', 30, 'jaune'),
  ('Petit suisse', 25, 'jaune'),
  ('Crème glacée vanille', 38, 'jaune');

-- Oléagineux
INSERT INTO foods (nom, ig, liste) VALUES
  ('Graines de courge', 25, 'jaune'),
  ('Graines de lin', 35, 'jaune'),
  ('Purée d''amandes', 35, 'jaune'),
  ('Purée de cacahuètes', 25, 'jaune'),
  ('Purée de noisettes', 25, 'jaune');

-- Chocolat & confiseries
INSERT INTO foods (nom, ig, liste) VALUES
  ('Chocolat noir < 85% cacao', 45, 'jaune'),
  ('Nutella', 33, 'jaune'),
  ('Sirop d''érable', 54, 'jaune'),
  ('Miel (toutes fleurs)', 54, 'jaune');

-- Farines
INSERT INTO foods (nom, ig, liste) VALUES
  ('Farine de pois chiche', 35, 'jaune'),
  ('Farine de quinoa', 40, 'jaune'),
  ('Farine de sarrasin', 40, 'jaune'),
  ('Farine de soja', 25, 'jaune');

-- Biscuits
INSERT INTO foods (nom, ig, liste) VALUES
  ('Biscuit petit beurre', 50, 'jaune');

-- ============================================================
-- LISTE ORANGE — 55 < IG < 70
-- ============================================================

-- Fruits
INSERT INTO foods (nom, ig, liste) VALUES
  ('Ananas', 66, 'orange'),
  ('Banane bien mûre', 65, 'orange'),
  ('Cerises en conserve', 63, 'orange'),
  ('Melon', 67, 'orange'),
  ('Papaye', 56, 'orange'),
  ('Raisins secs', 64, 'orange');

-- Légumes
INSERT INTO foods (nom, ig, liste) VALUES
  ('Betterave cuite', 64, 'orange'),
  ('Châtaigne', 60, 'orange'),
  ('Patate douce bouillie', 63, 'orange');

-- Pomme de terre
INSERT INTO foods (nom, ig, liste) VALUES
  ('Pomme de terre vapeur', 60, 'orange');

-- Céréales
INSERT INTO foods (nom, ig, liste) VALUES
  ('Couscous', 65, 'orange'),
  ('Gnocchi', 68, 'orange'),
  ('Polenta', 68, 'orange'),
  ('Riz basmati', 58, 'orange'),
  ('Riz blanc cuit', 64, 'orange'),
  ('Riz long grain', 68, 'orange'),
  ('Semoule de blé', 65, 'orange'),
  ('Pâtes bien cuites', 65, 'orange');

-- Pain
INSERT INTO foods (nom, ig, liste) VALUES
  ('Baguette blanche', 70, 'orange'),
  ('Croissant', 67, 'orange'),
  ('Pain complet au levain', 65, 'orange'),
  ('Pain de mie multicéréales', 65, 'orange'),
  ('Pain aux raisins', 63, 'orange'),
  ('Pita', 65, 'orange');

-- Boissons
INSERT INTO foods (nom, ig, liste) VALUES
  ('Bière', 66, 'orange'),
  ('Coca Cola', 58, 'orange'),
  ('Limonade', 58, 'orange'),
  ('Orangina', 68, 'orange'),
  ('Sodas sucrés', 68, 'orange');

-- Produits laitiers
INSERT INTO foods (nom, ig, liste) VALUES
  ('Flan au lait', 65, 'orange'),
  ('Yaourt aux fruits', 57, 'orange'),
  ('Yaourt nature sucré', 60, 'orange');

-- Sucreries & confiseries
INSERT INTO foods (nom, ig, liste) VALUES
  ('Caramel', 58, 'orange'),
  ('Cassonade', 65, 'orange'),
  ('Confiture', 65, 'orange'),
  ('Crème glacée chocolat', 61, 'orange'),
  ('Crêpes nature maison', 67, 'orange'),
  ('Miel commercial', 62, 'orange'),
  ('Sucre de table', 65, 'orange');

-- Plats préparés
INSERT INTO foods (nom, ig, liste) VALUES
  ('Couscous marocain', 58, 'orange'),
  ('Hachis parmentier', 65, 'orange'),
  ('Pizza au fromage', 60, 'orange'),
  ('Sushis', 52, 'orange');

-- ============================================================
-- LISTE ROUGE — IG > 70
-- ============================================================

-- Fruits
INSERT INTO foods (nom, ig, liste) VALUES
  ('Dattes séchées', 103, 'rouge'),
  ('Pastèque', 72, 'rouge'),
  ('Lychees au sirop', 79, 'rouge');

-- Légumes
INSERT INTO foods (nom, ig, liste) VALUES
  ('Fèves cuites', 79, 'rouge'),
  ('Panais', 97, 'rouge'),
  ('Potiron / citrouille', 75, 'rouge'),
  ('Rutabaga cuit', 72, 'rouge');

-- Pomme de terre
INSERT INTO foods (nom, ig, liste) VALUES
  ('Frites', 75, 'rouge'),
  ('Pomme de terre au four', 95, 'rouge'),
  ('Pomme de terre bouillie', 78, 'rouge'),
  ('Pomme de terre rissolées', 70, 'rouge'),
  ('Purée de pomme de terre', 80, 'rouge'),
  ('Purée instantanée', 83, 'rouge');

-- Céréales & dérivés
INSERT INTO foods (nom, ig, liste) VALUES
  ('Farine de blé blanche', 71, 'rouge'),
  ('Farine de riz', 95, 'rouge'),
  ('Farine de maïs', 70, 'rouge'),
  ('Galettes de riz', 78, 'rouge'),
  ('Maïzena', 85, 'rouge'),
  ('Millet cuit', 71, 'rouge'),
  ('Riz cuisson rapide', 75, 'rouge'),
  ('Tapioca', 81, 'rouge');

-- Céréales du petit déjeuner
INSERT INTO foods (nom, ig, liste) VALUES
  ('Cheerios', 74, 'rouge'),
  ('Chocapic', 84, 'rouge'),
  ('Coco Pops', 77, 'rouge'),
  ('Corn Flakes', 81, 'rouge'),
  ('Frosties', 72, 'rouge'),
  ('Golden Grahams', 71, 'rouge'),
  ('Nesquik céréales', 84, 'rouge'),
  ('Rice Krispies', 82, 'rouge'),
  ('Special K', 84, 'rouge'),
  ('Weetabix', 74, 'rouge');

-- Pain
INSERT INTO foods (nom, ig, liste) VALUES
  ('Baguette blanche (IG élevé)', 95, 'rouge'),
  ('Pain blanc', 95, 'rouge'),
  ('Baguette courante', 75, 'rouge'),
  ('Pain de campagne', 70, 'rouge'),
  ('Pain de mie nature', 75, 'rouge'),
  ('Cracottes', 75, 'rouge'),
  ('Muffin nature', 77, 'rouge'),
  ('Pain d''épice', 82, 'rouge');

-- Biscuits & pâtisseries
INSERT INTO foods (nom, ig, liste) VALUES
  ('Gaufres', 76, 'rouge'),
  ('Barquettes fourrées', 77, 'rouge');

-- Confiseries
INSERT INTO foods (nom, ig, liste) VALUES
  ('Bonbons gélifiés', 80, 'rouge'),
  ('Carambar', 70, 'rouge'),
  ('Glucose', 100, 'rouge'),
  ('Guimauves', 70, 'rouge'),
  ('Sirop de grenadine', 70, 'rouge'),
  ('Sucre glace', 70, 'rouge'),
  ('Skittles', 70, 'rouge');

-- Laits végétaux à IG élevé
INSERT INTO foods (nom, ig, liste) VALUES
  ('Lait de riz', 86, 'rouge');
